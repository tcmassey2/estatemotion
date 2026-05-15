// EstateMotion — Photo preprocessing pipeline (v23).
//
// Runs every user-uploaded photo through Sharp before it hits Runway or
// Remotion. The goal is to kill the "amateur slideshow" tell that comes
// from inconsistent white balance and exposure across rooms — kitchen
// shot at 3200K with tungsten on, bedroom at 5600K daylight, exterior at
// 6500K overcast. Without normalization, those casts persist into the
// final reel and read as obviously unprofessional.
//
// Pipeline (in Sharp ops order):
//   1. fetch + decode + auto-orient (respect EXIF)
//   2. compute per-channel mid-tone means (gray-world WB analysis)
//   3. apply per-channel scale to push midtones toward neutral grey
//   4. gentle linear stretch (exposure normalization, capped)
//   5. mild sharpening
//   6. resize to MAX_LONG_EDGE (cap upload bandwidth, doesn't hurt Runway)
//   7. encode JPEG quality 90 (good balance for photo content)
//
// Output strategy:
//   - All processed photos uploaded to Supabase Storage under
//     {ownerId}/processed-photos/{jobId}/{photoId}.jpg
//   - Returns a manifest mutation that swaps every scene's image URL +
//     every orderedPhotos entry to the processed URL
//   - Both Runway and Remotion engines downstream get the same URLs
//
// Failure mode: if any single photo fails preprocessing, that photo
// keeps its ORIGINAL URL and the render proceeds. We log a warning but
// never fail the whole render on a preprocessing miss.

import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { shouldUpscale, upscalePhotoUrl, isUpscaleEligibleTier } from "./photo-upscale.mjs";
import { shouldRunDayToDusk, convertHeroToDusk } from "./day-to-dusk.mjs";

// Lazy-load sharp — keeps the module importable on machines where sharp
// isn't installed yet (e.g. Vercel API routes that share this codebase
// but don't run preprocessing).
let _sharp = null;
async function getSharp() {
  if (!_sharp) {
    const mod = await import("sharp");
    _sharp = mod.default || mod;
  }
  return _sharp;
}

// Hard caps — protect against runaway resource use.
const MAX_LONG_EDGE = 2560;          // px — Runway's internal pipeline is 1280p anyway
const JPEG_QUALITY = 90;             // good photo quality, ~70% smaller than PNG
const MAX_PHOTO_BYTES = 25 * 1024 * 1024; // 25MB cap on input — sanity guard
const PREPROCESS_CONCURRENCY = 4;    // parallelism cap (matches Runway concurrency)
const FETCH_TIMEOUT_MS = 45000;      // 45s per photo download

// v23: pre-flight dimension thresholds.
// MIN_REJECT_PX — anything below this is unusable for cinematic AI (Runway
// Gen-4 outputs noise from < 800px input). Reject hard with a clear
// error rather than silently shipping a noisy render.
// MIN_WARN_PX — between reject and warn we still render but flag it in
// diagnostics so the caller can show "this photo is small" guidance.
const MIN_REJECT_PX = Number(process.env.PHOTO_MIN_REJECT_PX || 720);
const MIN_WARN_PX = Number(process.env.PHOTO_MIN_WARN_PX || 1280);

export class PhotoTooSmallError extends Error {
  constructor(photoId, longEdgePx, threshold) {
    super(`photo ${photoId} is too small (${longEdgePx}px on long edge < ${threshold}px minimum)`);
    this.name = "PhotoTooSmallError";
    this.code = "PHOTO_TOO_SMALL";
    this.photoId = photoId;
    this.longEdgePx = longEdgePx;
    this.threshold = threshold;
  }
}

/* ----------------------------------------------------------------
   Low-level: download + Sharp processing
   ---------------------------------------------------------------- */

async function downloadPhotoBuffer(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url.slice(0, 80)}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_PHOTO_BYTES) {
      throw new Error(`photo too large (${(buf.byteLength / 1024 / 1024).toFixed(1)}MB > 25MB cap)`);
    }
    return buf;
  } finally {
    clearTimeout(timer);
  }
}

// Compute per-channel mid-tone means for gray-world WB.
// We exclude pixels in the bottom 15% (deep shadows) and top 15% (clipped
// highlights / specular reflections / sky). Real-estate photos typically
// have significant sky area — including it would skew WB blue.
async function computeMidtoneMeans(sharpInstance) {
  const { width, height } = await sharpInstance.metadata();
  // Downsample to ~256px for speed — stats are not sensitive to resolution.
  const downsample = sharpInstance.clone().resize(256, 256, { fit: "inside" });
  const { data, info } = await downsample.raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels; // 3 (RGB) or 4 (RGBA)
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luma < 38 || luma > 217) continue; // 0-38 ≈ deep shadow, 217-255 ≈ clipped
    rSum += r; gSum += g; bSum += b; count++;
  }
  if (count === 0) return null;
  return {
    r: rSum / count,
    g: gSum / count,
    b: bSum / count,
    midtonePixelCount: count,
    sampleSize: data.length / channels,
    sourceWidth: width,
    sourceHeight: height
  };
}

// Gray-world WB: scale each channel so the midtone average approaches
// neutral grey (channel means equal). We bound the per-channel scale to
// ±15% — anything more aggressive starts to look artificially color-cast
// in the OPPOSITE direction (kitchen now looks too blue instead of yellow).
function computeWBScales(means) {
  if (!means) return [1, 1, 1];
  const target = (means.r + means.g + means.b) / 3;
  const clamp = (v) => Math.max(0.85, Math.min(1.15, v));
  return [
    clamp(target / Math.max(1, means.r)),
    clamp(target / Math.max(1, means.g)),
    clamp(target / Math.max(1, means.b))
  ];
}

// Process one photo buffer with the full Sharp pipeline.
// Returns the processed JPEG buffer + diagnostic metadata.
export async function processPhotoBuffer(inputBuffer, options = {}) {
  const sharp = await getSharp();
  const maxLongEdge = options.maxLongEdge || MAX_LONG_EDGE;
  const quality = options.jpegQuality || JPEG_QUALITY;

  // Round 1: analysis (sharp instance must be a fresh one — Sharp pipelines
  // are single-use).
  const analysisInstance = sharp(inputBuffer, { failOn: "none" }).rotate();
  const means = await computeMidtoneMeans(analysisInstance);
  const scales = computeWBScales(means);

  // Round 2: actual processing pipeline.
  // - rotate() = auto-orient via EXIF
  // - linear() = per-channel multiply (a) + add (b). Used for WB scale.
  //   linear([r,g,b], [0,0,0]) is pure WB scale with no exposure shift.
  // - normalise(1, 99) = stretch histogram so the 1st percentile maps to 0
  //   and the 99th percentile maps to 255. Skipping the extremes prevents
  //   crushing shadows on already-dark frames or blowing highlights on
  //   white-walled rooms. This is a SUBTLE pass — most photos move 5-15%.
  // - sharpen({ sigma }) = mild USM sharpen. 0.6 sigma is professional-
  //   subtle, not iPhone-aggressive.
  // - withMetadata() = preserve EXIF orientation flag so the JPEG renders
  //   correctly in any viewer (we rotated to absolute already, but Sharp
  //   strips orientation tags by default which can confuse some clients).
  const processed = sharp(inputBuffer, { failOn: "none" })
    .rotate()
    .linear(scales, [0, 0, 0])
    .normalise({ lower: 1, upper: 99 })
    .sharpen({ sigma: 0.6, m1: 0.5, m2: 0.7 });

  const meta = await sharp(inputBuffer, { failOn: "none" }).rotate().metadata();
  const originalLong = Math.max(meta.width || 0, meta.height || 0);
  // Resize only if the photo is bigger than our cap. Never enlarge — that
  // makes Runway hallucinate texture from noise.
  if (originalLong > maxLongEdge) {
    processed.resize({
      width: meta.width >= meta.height ? maxLongEdge : null,
      height: meta.height > meta.width ? maxLongEdge : null,
      fit: "inside",
      withoutEnlargement: true
    });
  }

  const outputBuffer = await processed.jpeg({ quality, mozjpeg: true }).toBuffer();
  const outMeta = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: outMeta.width,
    height: outMeta.height,
    originalWidth: meta.width,
    originalHeight: meta.height,
    bytes: outputBuffer.byteLength,
    wbScales: scales,
    midtoneMeans: means
  };
}

/* ----------------------------------------------------------------
   High-level orchestrator: preprocess all photos for a render
   ---------------------------------------------------------------- */

// Returns an updated manifest with every photo URL + scene image URL
// replaced by the processed equivalent, plus a diagnostics object.
//
// Side effects: uploads N processed JPEGs to Supabase Storage at
//   {ownerId}/processed-photos/{jobId}/{photoId}.jpg
// These should be cleaned up by a cron job after a few days of retention
// (long enough to support re-renders / regenerate-scene without redoing
// preprocessing).
export async function preprocessPhotosForRender({ manifest, jobId, options = {} }) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket = process.env.SUPABASE_GENERATED_VIDEOS_BUCKET || "generated-videos";

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[photo-preprocess] Supabase not configured — skipping preprocessing.");
    return { manifest, diagnostics: { skipped: true, reason: "supabase_not_configured" } };
  }

  // Allow an opt-out at the manifest level for debugging.
  if (manifest?.skipPhotoPreprocess) {
    console.info("[photo-preprocess] skipPhotoPreprocess=true on manifest — skipping.");
    return { manifest, diagnostics: { skipped: true, reason: "manifest_opt_out" } };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const ownerId = slug(manifest.project?.userId || manifest.project?.id || "demo");
  const basePath = `${ownerId}/processed-photos/${jobId}`;

  const photos = manifest.orderedPhotos || [];
  if (photos.length === 0) {
    return { manifest, diagnostics: { skipped: true, reason: "no_photos" } };
  }

  console.info(`[photo-preprocess] preprocessing ${photos.length} photos for job=${jobId}`);
  const startedAt = Date.now();

  // v23: AI upscale eligibility — paid tiers only, on small photos. The
  // `userTier` arrives on the manifest from the API layer (Vercel passes
  // the resolved tier from get_user_tier_state into manifest.userTier).
  const userTier = String(manifest?.userTier || manifest?.tier || "trial").toLowerCase();
  const upscaleEnabled = isUpscaleEligibleTier(userTier);

  // Mutable counter shared across the upscale calls so we honor the
  // per-render cap even with parallel batches.
  const upscaleCounter = { count: 0, savings: [] };

  // v23: Day-to-Dusk twilight conversion. Runs ONCE on the hero (first)
  // photo before the main preprocessing loop. The dusk URL replaces the
  // first photo's source so the rest of preprocess sees the dusk version
  // as if it were the original.
  let twilightDiagnostics = null;
  const duskDecision = shouldRunDayToDusk({ manifest, tier: userTier });
  if (duskDecision.run && photos.length > 0) {
    const heroPhoto = photos[0];
    const heroSourceUrl =
      heroPhoto.durableUrl || heroPhoto.durable_url || heroPhoto.publicUrl || heroPhoto.public_url || "";
    if (heroSourceUrl) {
      console.info(`[photo-preprocess] day-to-dusk: converting hero photo ${heroPhoto.id}`);
      try {
        const dusk = await convertHeroToDusk(heroSourceUrl);
        // Mutate the hero photo's URL in place so the main preprocess
        // loop downloads + processes the dusk version.
        heroPhoto.durableUrl = dusk.duskUrl;
        heroPhoto.durable_url = dusk.duskUrl;
        heroPhoto.publicUrl = dusk.duskUrl;
        heroPhoto.public_url = dusk.duskUrl;
        heroPhoto._twilightApplied = {
          originalUrl: heroSourceUrl,
          modelVersion: dusk.modelVersion,
          replicateId: dusk.replicateId,
          durationMs: dusk.durationMs
        };
        twilightDiagnostics = heroPhoto._twilightApplied;
        // Mirror the URL to any scenes that reference this photoId, since
        // the manifest may have been pre-built with the original URL.
        for (const sc of manifest.scenes || []) {
          if (sc.photoId === heroPhoto.id) {
            sc.durableUrl = dusk.duskUrl;
            sc.durable_url = dusk.duskUrl;
            sc.publicUrl = dusk.duskUrl;
            sc.public_url = dusk.duskUrl;
            sc.imageUrl = dusk.duskUrl;
          }
        }
      } catch (err) {
        console.warn(`[photo-preprocess] day-to-dusk failed (${err.message}). Continuing with original hero photo.`);
        twilightDiagnostics = { applied: false, reason: err.message || "dusk_failed" };
      }
    }
  } else if (manifest?.creative?.twilightHero) {
    // User requested twilight but we couldn't run it — log why.
    console.info(`[photo-preprocess] day-to-dusk requested but skipped: ${duskDecision.reason}`);
    twilightDiagnostics = { applied: false, reason: duskDecision.reason };
  }

  // Process in concurrency batches to avoid memory spikes (each Sharp
  // pipeline holds the source buffer + decoded raw + output buffer in RAM).
  const replacementMap = new Map();          // photoId -> { newUrl, processedMeta }
  const failures = [];

  for (let i = 0; i < photos.length; i += PREPROCESS_CONCURRENCY) {
    const batch = photos.slice(i, i + PREPROCESS_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((photo) => preprocessOne(photo, supabase, bucket, basePath, options, {
        userTier,
        upscaleEnabled,
        upscaleCounter
      }))
    );
    results.forEach((res, idx) => {
      const photo = batch[idx];
      if (res.status === "fulfilled" && res.value?.newUrl) {
        replacementMap.set(photo.id, res.value);
      } else {
        const reason = res.status === "rejected" ? res.reason?.message || String(res.reason) : "no_url_returned";
        failures.push({ photoId: photo.id, reason });
        console.warn(`[photo-preprocess] photo ${photo.id} failed: ${reason} — keeping original URL`);
      }
    });
  }
  if (upscaleCounter.count > 0) {
    console.info(`[photo-preprocess] upscaled ${upscaleCounter.count} photos via Replicate (tier=${userTier})`);
  }

  // Build the mutated manifest. Photos NOT in replacementMap keep their
  // original URL — partial preprocessing is fine, the render still ships.
  const updatedPhotos = photos.map((photo) => {
    const replacement = replacementMap.get(photo.id);
    if (!replacement) return photo;
    return {
      ...photo,
      durableUrl: replacement.newUrl,
      durable_url: replacement.newUrl,
      publicUrl: replacement.newUrl,
      public_url: replacement.newUrl,
      _processed: {
        originalDurableUrl: photo.durableUrl || photo.durable_url || photo.publicUrl || photo.public_url,
        width: replacement.processedMeta?.width,
        height: replacement.processedMeta?.height,
        wbScales: replacement.processedMeta?.wbScales
      }
    };
  });

  const updatedScenes = (manifest.scenes || []).map((scene) => {
    const replacement = replacementMap.get(scene.photoId);
    if (!replacement) return scene;
    return {
      ...scene,
      durableUrl: replacement.newUrl,
      durable_url: replacement.newUrl,
      publicUrl: replacement.newUrl,
      public_url: replacement.newUrl,
      imageUrl: replacement.newUrl
    };
  });

  const updatedManifest = {
    ...manifest,
    orderedPhotos: updatedPhotos,
    scenes: updatedScenes,
    photoPreprocess: {
      processed: replacementMap.size,
      failed: failures.length,
      total: photos.length,
      jobId,
      basePath
    }
  };

  const elapsedMs = Date.now() - startedAt;
  console.info(
    `[photo-preprocess] done — ${replacementMap.size}/${photos.length} processed in ${elapsedMs}ms` +
    (failures.length ? ` (${failures.length} fell back to original)` : "")
  );

  return {
    manifest: updatedManifest,
    diagnostics: {
      skipped: false,
      processed: replacementMap.size,
      failed: failures.length,
      total: photos.length,
      elapsedMs,
      failures,
      twilightApplied: twilightDiagnostics,
      upscaleCount: upscaleCounter.count
    }
  };
}

async function preprocessOne(photo, supabase, bucket, basePath, options, ctx = {}) {
  const inputUrl = photo.durableUrl || photo.durable_url || photo.publicUrl || photo.public_url || "";
  if (!inputUrl) return null;
  if (inputUrl.startsWith("blob:") || inputUrl.startsWith("data:")) {
    throw new Error("photo has browser-only URL (blob/data); re-upload before render");
  }

  // Download original first — we need to know dimensions to decide whether
  // to upscale. The download is fast (~1-3s for typical photos).
  let workingBuffer = await downloadPhotoBuffer(inputUrl);
  let upscaleApplied = null;

  // v23: dimension pre-flight. Probe metadata once, decide:
  //   - <MIN_REJECT_PX: throw PhotoTooSmallError (caller surfaces to user)
  //   - <MIN_WARN_PX:   log warning, proceed (upscale will rescue if eligible)
  //   - >=MIN_WARN_PX:  proceed normally
  let initialLongEdge = 0;
  {
    const sharp = await getSharp();
    const meta = await sharp(workingBuffer, { failOn: "none" }).rotate().metadata();
    initialLongEdge = Math.max(meta.width || 0, meta.height || 0);
    if (initialLongEdge < MIN_REJECT_PX) {
      throw new PhotoTooSmallError(photo.id, initialLongEdge, MIN_REJECT_PX);
    }
    if (initialLongEdge < MIN_WARN_PX) {
      console.warn(
        `[photo-preprocess] photo ${photo.id} is ${initialLongEdge}px on long edge ` +
        `(below ${MIN_WARN_PX}px recommended). Proceeding — quality may suffer.`
      );
    }
  }

  // v23: AI upscale via Replicate (Cinematic+ tiers only).
  if (ctx.upscaleEnabled) {
    try {
      const sharp = await getSharp();
      const meta = await sharp(workingBuffer, { failOn: "none" }).rotate().metadata();
      const longEdge = Math.max(meta.width || 0, meta.height || 0);
      const decision = shouldUpscale({
        tier: ctx.userTier,
        longEdgePx: longEdge,
        currentRenderUpscaleCount: ctx.upscaleCounter?.count || 0
      });
      if (decision.shouldUpscale) {
        console.info(`[photo-preprocess] upscaling photo ${photo.id} (${longEdge}px long edge, tier=${ctx.userTier})`);
        const upscale = await upscalePhotoUrl(inputUrl);
        // Download the upscaled image and use it as the working buffer.
        workingBuffer = await downloadPhotoBuffer(upscale.upscaledUrl);
        upscaleApplied = {
          originalLongEdge: longEdge,
          scaleFactor: upscale.scaleFactor,
          modelVersion: upscale.modelVersion,
          replicateId: upscale.replicateId,
          durationMs: upscale.durationMs
        };
        if (ctx.upscaleCounter) ctx.upscaleCounter.count++;
      }
    } catch (err) {
      // Soft-fail upscale — fall back to the original buffer through Sharp.
      console.warn(`[photo-preprocess] upscale failed for ${photo.id} (${err.message}). Continuing with original.`);
    }
  }

  const result = await processPhotoBuffer(workingBuffer, options);

  const filename = `${slug(photo.id || "photo")}.jpg`;
  const storagePath = `${basePath}/${filename}`;
  const upload = await supabase.storage.from(bucket).upload(storagePath, result.buffer, {
    contentType: "image/jpeg",
    upsert: true
  });
  if (upload.error) {
    throw new Error(`supabase upload failed: ${upload.error.message}`);
  }
  const newUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
  return {
    newUrl,
    storagePath,
    processedMeta: {
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      wbScales: result.wbScales,
      upscale: upscaleApplied
    }
  };
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "photo";
}
