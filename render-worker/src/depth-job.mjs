// EstateMotion — Depth-based engine orchestrator (Path B).
//
// Full peer of renderRunwayJob. Same input contract (manifest, options),
// same output shape (videoUrl + variants + shorts + thumbnail + per-scene
// metadata + audit log). server.mjs routes engine='depth' here.
//
// PER-SCENE PIPELINE (the new bit):
//   1. Download photo to local temp.
//   2. Replicate depth-anything-v2 → depth map → download.
//   3. depth-renderer.mjs → per-scene MP4 (vertex-displaced parallax).
//   4. (Phase 2) Disocclusion mask → LaMa inpaint per frame → restitch.
//
// POST-PROCESSING (reused from runway-job.mjs):
//   stitchClipsAndOverlays  — normalize, watermark, headshot, crossfade,
//                             outro card, thumbnail.
//   applyVoiceNarration     — ElevenLabs + duck music under voice.
//   deriveAspectVariants    — 9:16, 16:9, 1:1 variants from master.
//   buildSocialShorts       — three highlight clips for social.
//   uploadDeliverables      — Supabase storage upload.
//   uploadPerSceneClips     — per-scene clip upload for regenerate support.
//   writeRenderAudit        — fire-and-forget audit row.
//
// SAFETY GATE:
//   ENABLE_DEPTH_ENGINE=true env var on the worker. Without it, any
//   engine='depth' request errors out cleanly. Flip after smoke:gl and
//   smoke:depth both pass on the worker.
//
// PHASE TRACKING:
//   Phase 1 (this version): depth + render + stitch + voice + music
//                           + variants + upload. No inpainting yet.
//                           Disocclusion gaps will look stretched at
//                           strong depth discontinuities.
//   Phase 2 (next):         per-frame disocclusion masks + LaMa inpaint
//                           pass before stitching.
//   Phase 3 (later):        per-room camera profiles, per-style intensity,
//                           flat-depth → Ken Burns auto-route.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { renderDepthClip, cameraPathFor } from "./depth-renderer.mjs";
import { estimateDepth } from "./replicate-client.mjs";
import {
  stitchClipsAndOverlays,
  uploadDeliverables,
  uploadPerSceneClips
} from "./runway-job.mjs";
import { applyVoiceNarration } from "./voice-mixer.mjs";
import { deriveAspectVariants, buildSocialShorts } from "./aspect-variants.mjs";
import { writeRenderAudit } from "./audit-log.mjs";
import { runFFmpeg } from "./ffmpeg-runner.mjs";
import { existsSync } from "node:fs";

const ENABLE_FLAG = process.env.ENABLE_DEPTH_ENGINE === "true";

/* ============================================================
   Public entry: renderDepthJob
   ============================================================
   Mirrors renderRunwayJob's signature so server.mjs can route to
   either engine interchangeably.
*/
export async function renderDepthJob(body, options = {}) {
  if (!ENABLE_FLAG) {
    throw new Error(
      "Depth engine is not yet enabled on this worker. " +
      "Set ENABLE_DEPTH_ENGINE=true in the worker env to unlock. " +
      "(Intentional gate — flip after smoke:gl + smoke:depth pass on the worker.)"
    );
  }

  const { manifest, jobId } = body;
  if (!manifest) throw new Error("renderDepthJob: missing manifest");
  if (!jobId) throw new Error("renderDepthJob: missing jobId");

  const photoScenes = (manifest.scenes || []).filter(
    (s) => String(s.type || "photo").toLowerCase() === "photo"
  );
  if (photoScenes.length === 0) throw new Error("renderDepthJob: no photo scenes in manifest");

  const tempDir = path.join(os.tmpdir(), `em-depth-${jobId}`);
  await fs.mkdir(tempDir, { recursive: true });

  const dims = depthDimensions(manifest);
  const frameRate = Number(manifest?.runwayConfig?.frameRate || 24);

  options.onProgress?.({ phase: "Depth engine: starting", progress: 5 });

  // ============================================================
  // Step 1: per-scene depth render
  // ============================================================
  // Serial for v1 to stay memory-safe on Render Pro 4GB. depth +
  // WebGL each peak around 200-400 MB; running two in parallel risks
  // OOM. Phase 3 measures real memory and bumps to 2-at-a-time if safe.
  const clipResults = [];
  for (let i = 0; i < photoScenes.length; i++) {
    const scene = photoScenes[i];
    options.onProgress?.({
      phase: `Depth render scene ${i + 1}/${photoScenes.length}`,
      progress: 8 + Math.floor(58 * (i / photoScenes.length))
    });
    const result = await renderOneScene({
      scene,
      manifest,
      tempDir,
      dims,
      frameRate,
      sceneIndex: i
    });
    clipResults.push(result);
  }

  // ============================================================
  // Step 2: stitch + brand overlays (reused from runway-job)
  // ============================================================
  options.onProgress?.({ phase: "Stitching final video", progress: 76 });
  const finalMp4 = path.join(tempDir, `${jobId}.mp4`);
  const thumbnailPath = path.join(tempDir, `${jobId}.png`);

  const { normalizedClips } = await stitchClipsAndOverlays(
    clipResults,
    manifest,
    finalMp4,
    thumbnailPath,
    options
  );

  // ============================================================
  // Step 3: music bed (mirrors runway-job's inline music mix step
  // because that block is engine-agnostic but not yet extracted)
  // ============================================================
  options.onProgress?.({ phase: "Adding music bed", progress: 79 });
  const musicUrl = pickMusicUrl(manifest);
  const masterWithMusic = path.join(tempDir, `${jobId}-music.mp4`);
  if (musicUrl) {
    const musicBedLevel = Number(
      manifest?.musicBedLevel ?? process.env.MUSIC_BED_LEVEL ?? 0.35
    );
    await runFFmpeg([
      "-y",
      "-threads", "1",
      "-i", finalMp4,
      "-i", musicUrl,
      "-filter_complex", `[1:a]volume=${musicBedLevel.toFixed(3)}[mus]`,
      "-c:v", "copy",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      "-map", "0:v:0",
      "-map", "[mus]",
      masterWithMusic
    ], { timeoutMs: 120000, label: "depth:music-mix" });
  } else {
    await fs.copyFile(finalMp4, masterWithMusic);
  }

  // ============================================================
  // Step 4: voice narration (reused from runway-job)
  // ============================================================
  options.onProgress?.({ phase: "Adding voice narration", progress: 82 });
  let narration = { narrationApplied: false, reason: "skipped" };
  if (manifest?.skipNarration) {
    console.info("[depth] skipNarration=true on manifest — skipping voice step.");
  } else {
    const NARRATION_TIME_BUDGET_MS = 120 * 1000;
    try {
      narration = await Promise.race([
        applyVoiceNarration({
          masterMp4: masterWithMusic,
          scenes: manifest.scenes,
          brandKit: manifest.brandKit || {},
          tempDir,
          jobId,
          manifest,
          onProgress: (info) => {
            options.onProgress?.({ phase: info.phase, progress: 82 + Math.floor((info.fraction || 0) * 4) });
          }
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Narration step exceeded 2-minute time budget.")), NARRATION_TIME_BUDGET_MS)
        )
      ]);
    } catch (err) {
      console.warn(`[depth] narration step failed (${err.message}). Continuing with music-only audio.`);
      narration = { narrationApplied: false, reason: err.message || "narration_failed" };
    }
  }
  const masterForVariants = narration.narrationApplied ? narration.masterMp4 : masterWithMusic;

  // ============================================================
  // Step 5: aspect variants + social shorts (reused from runway-job)
  // ============================================================
  options.onProgress?.({ phase: "Deriving aspect variants", progress: 88 });
  const wants4K = Boolean(
    manifest?.runwayConfig?.is4K ||
    manifest?.runwayConfig?.upscale4K ||
    manifest?.export4K ||
    String(manifest?.exportFormat || "").toLowerCase().includes("4k")
  );
  let variants = {};
  try {
    variants = await deriveAspectVariants({
      masterMp4: masterForVariants,
      tempDir,
      jobId,
      upscale4K: wants4K
    });
  } catch (err) {
    console.warn(`[depth] aspect variants failed (${err.message}). Falling back to vertical-only.`);
    variants = { vertical: { format: "vertical", path: masterForVariants, dimensions: { w: 1080, h: 1920 } } };
  }
  if (!variants.vertical?.path) {
    variants.vertical = { format: "vertical", path: masterForVariants, dimensions: { w: 1080, h: 1920 } };
  }

  options.onProgress?.({ phase: "Cutting social shorts", progress: 92 });
  let shorts = [];
  try {
    shorts = await buildSocialShorts({
      masterMp4: masterForVariants,
      scenes: manifest.scenes,
      tempDir,
      jobId,
      count: 3
    });
  } catch (err) {
    console.warn(`[depth] social shorts failed (${err.message}). Continuing without shorts.`);
    shorts = [];
  }

  // ============================================================
  // Step 6: upload deliverables + per-scene clips (reused)
  // ============================================================
  options.onProgress?.({ phase: "Uploading deliverables", progress: 94 });
  const upload = await uploadDeliverables({
    manifest,
    jobId,
    variants,
    shorts,
    thumbnailPath,
    pathPrefix: "depth",
    onProgress: (info) => {
      options.onProgress?.({
        phase: info.phase || `Uploading ${info.fileLabel || "deliverables"}`,
        progress: 94 + Math.floor((info.fraction || 0) * 5)
      });
    }
  });

  const scenesMeta = await uploadPerSceneClips({
    manifest,
    jobId,
    normalizedClips,
    clipResults,
    pathPrefix: "depth"
  });

  // Cleanup per-scene local files.
  for (const clip of normalizedClips) {
    await fs.unlink(clip.clipPath).catch(() => {});
  }

  options.onProgress?.({ phase: "Ready to download", progress: 100 });

  // Audit log — fire-and-forget so a slow Supabase write doesn't block.
  writeRenderAudit({
    jobId,
    manifest,
    upload,
    scenesMeta,
    narration,
    engineUsed: "depth_parallax",
    enginePhase: "phase1-no-inpaint",
    promptVersion: manifest?.promptVersion || null
  }).catch((err) => console.warn(`[depth] audit log failed: ${err.message}`));

  return {
    ...upload,
    scenesMeta,
    narrationApplied: narration.narrationApplied,
    engineUsed: "depth_parallax",
    enginePhase: "phase1-no-inpaint"
  };
}

/* ============================================================
   Per-scene depth render
   ============================================================ */
async function renderOneScene({ scene, manifest, tempDir, dims, frameRate, sceneIndex }) {
  const imageUrl = scene.imageUrl || scene.photoUrl || scene.durableUrl;
  if (!imageUrl) {
    throw new Error(`Depth scene ${sceneIndex + 1} (${scene.photoId}): no source image URL`);
  }

  const padIdx = String(sceneIndex).padStart(3, "0");
  const photoPath = path.join(tempDir, `s${padIdx}-photo.jpg`);
  await downloadTo(imageUrl, photoPath);

  const depthUrl = await estimateDepth({ imageUrl });
  const depthPath = path.join(tempDir, `s${padIdx}-depth.png`);
  await downloadTo(depthUrl, depthPath);

  const motion = String(scene.cameraMotion || "push_in").toLowerCase().replace(/[^a-z_]/g, "");
  const cameraPath = cameraPathFor(motion);
  const durationSec = Math.max(2, Math.min(10, Number(scene.duration || 5)));
  const clipPath = path.join(tempDir, `s${padIdx}-clip.mp4`);

  const renderResult = await renderDepthClip({
    photoPath,
    depthPath,
    cameraPath,
    dimensions: dims,
    frameRate,
    durationSec,
    outPath: clipPath
  });

  // Clean up the source photo + depth map locally — we only need the
  // rendered clip from here on.
  await fs.unlink(photoPath).catch(() => {});
  await fs.unlink(depthPath).catch(() => {});

  return {
    sceneIndex,
    photoId: scene.photoId,
    clipPath: renderResult.outPath,
    duration: durationSec,
    cameraMotion: motion,
    engineUsed: "depth_parallax",
    fallback: false,
    runwayPrompt: "" // depth engine doesn't use prompts; field kept for upload compat
  };
}

/* ============================================================
   Helpers
   ============================================================ */
function depthDimensions(manifest) {
  const ratio = String(manifest?.runwayConfig?.ratio || manifest?.exportFormat || "9:16");
  if (ratio.includes("16:9") || ratio === "wide") return { width: 1920, height: 1080 };
  if (ratio === "1:1" || ratio === "square") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 }; // 9:16 default
}

async function downloadTo(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
}

// Music picker — mirrors the v22 runway-job logic. Manifest.musicTrack
// (set by the webapp's MusicSelector) wins; falls back to style slot.
function pickMusicUrl(manifest) {
  const musicDir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "music");
  const candidate = (name) => [
    path.join(musicDir, `${name}.mp3`),
    path.join(musicDir, `${name}.m4a`)
  ];

  const explicitTrack = String(manifest?.musicTrack || "").trim();
  if (explicitTrack) {
    const safeName = path.basename(explicitTrack);
    const explicitPath = path.join(musicDir, safeName);
    if (existsSync(explicitPath)) return explicitPath;
    console.warn(`[depth-music] manifest.musicTrack="${safeName}" not found — falling back to style default.`);
  }

  const mood = String(manifest.musicMood || manifest.selectedStyle || "").toLowerCase();
  let slot;
  if (mood.includes("social") || mood.includes("upbeat") || mood.includes("modern") || mood.includes("viral")) slot = "social";
  else if (mood.includes("mls") || mood.includes("ambient") || mood.includes("clean")) slot = "mls";
  else if (mood.includes("investor") || mood.includes("minimal")) slot = "investor";
  else slot = "luxury";

  for (const localPath of candidate(slot)) {
    if (existsSync(localPath)) return localPath;
  }
  for (const localPath of candidate("default")) {
    if (existsSync(localPath)) return localPath;
  }
  return null;
}

export const DEPTH_ENGINE_ENABLED = ENABLE_FLAG;
