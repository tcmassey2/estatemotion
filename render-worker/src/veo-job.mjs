// EstateMotion — Veo 3.1 Fast image-to-video worker (v25).
//
// Replaces the Runway Gen-4 Turbo engine. Veo 3.1 is Google's image-to-
// video model on Vertex AI; we use the "Fast" variant which is cheaper
// ($0.15/sec) while still scoring above Runway on the leaderboards as
// of June 2026. Crucially for our use case, Veo 3.1 has physics-aware
// motion that is materially better at preserving cabinets, fixtures,
// blinds, and other repeating-geometry features that Runway warps.
//
// THIS FILE IS PHASE 1 ONLY. It exports the per-scene generation
// primitive (`generateVeoClip`) plus a tiny `runVeoSmokeTest` helper
// the server.mjs `/test/veo` endpoint calls. It does NOT yet route
// production renders — see runway-job.mjs which is still the production
// path. Phase 2 will rewire the dispatcher once we've validated quality
// on Troy's $300 Google Cloud free credit.
//
// ─── Environment ────────────────────────────────────────────────
// Required:
//   GOOGLE_CLOUD_PROJECT             - GCP project ID (e.g. "estatemotion-prod")
//   GOOGLE_APPLICATION_CREDENTIALS   - path to service-account JSON file
//                                       (Render: write env JSON to disk at boot)
//   VEO_OUTPUT_GCS_BUCKET            - gs://bucket-name where Veo writes the mp4
//
// Optional:
//   GOOGLE_CLOUD_LOCATION            - default "global" (Veo 3.1 Fast)
//   VEO_MODEL                        - default "veo-3.1-fast-generate-001"
//   VEO_POLL_SECONDS                 - default 10
//   VEO_MAX_POLL_MINUTES             - default 5 (300s) before giving up
//
// ─── Service-account JSON on disk ────────────────────────────────
// Render.com (and Vercel) don't let you upload files. Standard pattern
// is to put the service-account JSON in an env var and write it to disk
// at boot. The bootstrap (in server.mjs) does:
//   if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
//     fs.writeFileSync("/tmp/gcp-sa.json", process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
//     process.env.GOOGLE_APPLICATION_CREDENTIALS = "/tmp/gcp-sa.json";
//   }
// before requiring this module.

import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

// Lazy-import @google/genai so the worker doesn't crash at boot if the
// dep isn't installed yet (we add it in this same commit, but during
// migration there's a window where the package isn't on disk yet).
let _GoogleGenAI = null;
async function getGoogleGenAI() {
  if (_GoogleGenAI) return _GoogleGenAI;
  try {
    const mod = await import("@google/genai");
    _GoogleGenAI = mod.GoogleGenAI || mod.default?.GoogleGenAI;
    if (!_GoogleGenAI) {
      throw new Error("@google/genai loaded but GoogleGenAI export not found.");
    }
    return _GoogleGenAI;
  } catch (err) {
    const msg = err?.code === "ERR_MODULE_NOT_FOUND"
      ? "@google/genai not installed. Run `npm install @google/genai` in render-worker/."
      : `Failed to load @google/genai: ${err.message || err}`;
    const wrapped = new Error(msg);
    wrapped.code = "VEO_SDK_UNAVAILABLE";
    throw wrapped;
  }
}

// Defaults the rest of the file uses.
const DEFAULT_MODEL = "veo-3.1-fast-generate-001";
const DEFAULT_LOCATION = "global";
const DEFAULT_POLL_SECONDS = 10;
const DEFAULT_MAX_POLL_MINUTES = 5;

/* =================================================================
   Veo client factory — single source of truth for auth + project.
   ================================================================= */

let _client = null;
async function getVeoClient() {
  if (_client) return _client;
  const GoogleGenAI = await getGoogleGenAI();
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || DEFAULT_LOCATION;
  if (!project) {
    const err = new Error(
      "Veo: GOOGLE_CLOUD_PROJECT env var is required. Set it on the worker."
    );
    err.code = "VEO_CONFIG_MISSING";
    throw err;
  }
  // The SDK auto-picks up GOOGLE_APPLICATION_CREDENTIALS for ADC. We
  // verify that the file exists up front so the error message is clear
  // when the bootstrap forgot to write the JSON.
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) {
    const err = new Error(
      "Veo: GOOGLE_APPLICATION_CREDENTIALS env var is required (path to SA JSON)."
    );
    err.code = "VEO_CONFIG_MISSING";
    throw err;
  }
  try {
    await fs.access(credPath);
  } catch {
    const err = new Error(
      `Veo: GOOGLE_APPLICATION_CREDENTIALS points to "${credPath}" but the file doesn't exist. Did the bootstrap write the SA JSON?`
    );
    err.code = "VEO_CONFIG_MISSING";
    throw err;
  }
  _client = new GoogleGenAI({
    vertexai: true,
    project,
    location
  });
  return _client;
}

/* =================================================================
   generateVeoClip — the per-scene primitive.

   Takes one source image (HTTPS or gs:// URL) + a motion prompt, calls
   Veo 3.1 Fast, polls until the operation completes, then downloads the
   resulting mp4 to the local temp dir. Returns:
     {
       clipPath:   "/tmp/.../scene-003.mp4",  // local file you can stitch
       sceneIndex: 3,
       photoId:    "uuid",
       duration:   5,                          // requested seconds
       gcsUri:     "gs://bucket/.../video.mp4",// where Veo dropped it
       veoOpName:  "projects/.../operations/..." // for ops/debug
     }

   Failures throw with a `.code` field:
     VEO_CONFIG_MISSING   - env vars not set
     VEO_SDK_UNAVAILABLE  - @google/genai not on disk
     VEO_GENERATE_FAILED  - submit failed (API error, 4xx/5xx)
     VEO_OP_FAILED        - operation completed but returned no video
     VEO_TIMEOUT          - polled VEO_MAX_POLL_MINUTES with no result
     VEO_DOWNLOAD_FAILED  - couldn't pull the mp4 from GCS
   ================================================================= */
export async function generateVeoClip({
  imageUrl,
  mimeType = "image/jpeg",
  prompt,
  aspectRatio = "9:16",     // EstateMotion ships vertical 9:16 masters
  duration = 5,             // Veo 3.1 emits 5s or 8s clips natively
  sceneIndex = 0,
  photoId = "",
  tempDir,
  outputGcsBucket = process.env.VEO_OUTPUT_GCS_BUCKET || "",
  pollSeconds = Number(process.env.VEO_POLL_SECONDS || DEFAULT_POLL_SECONDS),
  maxPollMinutes = Number(process.env.VEO_MAX_POLL_MINUTES || DEFAULT_MAX_POLL_MINUTES),
  model = process.env.VEO_MODEL || DEFAULT_MODEL
}) {
  if (!imageUrl) {
    const err = new Error("generateVeoClip: imageUrl is required.");
    err.code = "VEO_BAD_INPUT";
    throw err;
  }
  if (!prompt || !prompt.trim()) {
    const err = new Error("generateVeoClip: prompt is required.");
    err.code = "VEO_BAD_INPUT";
    throw err;
  }
  if (!outputGcsBucket) {
    const err = new Error(
      "generateVeoClip: VEO_OUTPUT_GCS_BUCKET env var required (e.g. gs://estatemotion-veo-output)."
    );
    err.code = "VEO_CONFIG_MISSING";
    throw err;
  }
  if (!tempDir) {
    const err = new Error("generateVeoClip: tempDir is required for download.");
    err.code = "VEO_BAD_INPUT";
    throw err;
  }

  const client = await getVeoClient();

  // Veo accepts either:
  //   - gcsUri:  gs://bucket/path/to/image.jpg
  //   - imageBytes (base64) + mimeType
  // For HTTPS Supabase URLs we have to inline the bytes — Veo does not
  // accept arbitrary HTTPS image URLs.
  let imagePayload;
  if (imageUrl.startsWith("gs://")) {
    imagePayload = { gcsUri: imageUrl, mimeType };
  } else {
    const bytes = await downloadImageBytes(imageUrl);
    imagePayload = {
      imageBytes: bytes.toString("base64"),
      mimeType: bytes.detectedMimeType || mimeType
    };
  }

  // Output URI is a *folder* — Veo writes one or more videos under it
  // with auto-generated names. Scope per-scene so we can find/clean them.
  const jobStamp = Date.now();
  const outputGcsUri = `${outputGcsBucket.replace(/\/$/, "")}/scene-${String(sceneIndex).padStart(3, "0")}-${jobStamp}/`;

  // Submit the generation operation.
  let operation;
  try {
    operation = await client.models.generateVideos({
      model,
      prompt,
      image: imagePayload,
      config: {
        aspectRatio,
        outputGcsUri,
        // Veo defaults to 8s. Override for short scenes.
        durationSeconds: clamp(Number(duration) || 5, 4, 8)
      }
    });
  } catch (err) {
    const wrapped = new Error(
      `Veo generateVideos submit failed for scene ${sceneIndex + 1}: ${err.message || err}`
    );
    wrapped.code = "VEO_GENERATE_FAILED";
    wrapped.cause = err;
    throw wrapped;
  }

  // Poll the operation. Each iteration sleeps `pollSeconds` then calls
  // operations.get to refresh status. Veo 3.1 Fast typically completes
  // in 60-180s on the Vertex AI side.
  const deadline = Date.now() + maxPollMinutes * 60 * 1000;
  while (!operation.done) {
    if (Date.now() > deadline) {
      const err = new Error(
        `Veo scene ${sceneIndex + 1} did not complete within ${maxPollMinutes} minutes.`
      );
      err.code = "VEO_TIMEOUT";
      err.veoOpName = operation?.name;
      throw err;
    }
    await sleep(pollSeconds * 1000);
    try {
      operation = await client.operations.get({ operation });
    } catch (err) {
      // Transient ops-poll failures shouldn't kill the whole job — log
      // and try again on next tick.
      console.warn(
        `[veo] operations.get failed for scene ${sceneIndex + 1}: ${err.message || err}. Will retry.`
      );
    }
  }

  // Operation done — extract the resulting video URI.
  const generated = operation?.response?.generatedVideos?.[0]?.video;
  const videoUri = generated?.uri || generated?.gcsUri || "";
  if (!videoUri) {
    const err = new Error(
      `Veo scene ${sceneIndex + 1} operation completed but no video URI was returned.`
    );
    err.code = "VEO_OP_FAILED";
    err.opName = operation?.name;
    err.responseSnapshot = JSON.stringify(operation?.response || {}).slice(0, 300);
    throw err;
  }

  // Download the mp4 from GCS to our local temp dir so the rest of the
  // pipeline (stitch, normalize, upload to Supabase) can treat it the
  // same as a Runway clip.
  const clipPath = path.join(
    tempDir,
    `veo-scene-${String(sceneIndex).padStart(3, "0")}.mp4`
  );
  try {
    await downloadGcsObject(videoUri, clipPath);
  } catch (err) {
    const wrapped = new Error(
      `Veo scene ${sceneIndex + 1} download failed (${videoUri}): ${err.message || err}`
    );
    wrapped.code = "VEO_DOWNLOAD_FAILED";
    wrapped.cause = err;
    throw wrapped;
  }

  return {
    clipPath,
    sceneIndex,
    photoId,
    duration: clamp(Number(duration) || 5, 4, 8),
    gcsUri: videoUri,
    veoOpName: operation?.name || ""
  };
}

/* =================================================================
   runVeoSmokeTest — POST /test/veo handler helper.
   One image + one prompt → one local clip path. Returns the path
   plus the upstream gcsUri so the caller can either serve the local
   file or hand back the GCS URI as a sanity check.
   ================================================================= */
export async function runVeoSmokeTest({ imageUrl, prompt, aspectRatio, duration, tempDir }) {
  return generateVeoClip({
    imageUrl,
    prompt,
    aspectRatio: aspectRatio || "9:16",
    duration: duration || 5,
    sceneIndex: 0,
    photoId: "smoke-test",
    tempDir
  });
}

/* =================================================================
   Helpers
   ================================================================= */

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// Download an HTTPS image (typically a Supabase Storage URL) into a
// Buffer. Adds a `detectedMimeType` property so the caller can override
// the default jpeg assumption when the server returns a different type.
async function downloadImageBytes(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Image fetch failed (${res.status}) for ${url}`);
  }
  const ct = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  buf.detectedMimeType = ct.includes("image/") ? ct.split(";")[0].trim() : null;
  return buf;
}

// Download an object from Google Cloud Storage using @google-cloud/storage.
// Reuses ADC (the same SA credentials the Veo client uses), so no extra
// auth config required. Lazy-import so unset envs don't crash boot.
let _storage = null;
async function getStorageClient() {
  if (_storage) return _storage;
  try {
    const { Storage } = await import("@google-cloud/storage");
    _storage = new Storage();
    return _storage;
  } catch (err) {
    const msg = err?.code === "ERR_MODULE_NOT_FOUND"
      ? "@google-cloud/storage not installed. Run `npm install @google-cloud/storage` in render-worker/."
      : `Failed to load @google-cloud/storage: ${err.message || err}`;
    const wrapped = new Error(msg);
    wrapped.code = "VEO_SDK_UNAVAILABLE";
    throw wrapped;
  }
}

async function downloadGcsObject(gsUri, destPath) {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(gsUri);
  if (!match) {
    throw new Error(`Not a gs:// URI: ${gsUri}`);
  }
  const [, bucket, key] = match;
  const storage = await getStorageClient();
  await storage.bucket(bucket).file(key).download({ destination: destPath });
}
