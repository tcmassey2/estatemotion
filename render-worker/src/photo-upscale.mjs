// EstateMotion — Replicate AI photo upscale (v23).
//
// Runs small photos through a super-resolution model on Replicate before
// they hit the Sharp preprocessing pipeline + Runway. Garbage in, garbage
// out applies double to AI image-to-video — feeding Runway a 1024×768 phone
// snap produces a noisy clip; feeding it a clean 4096×3072 version produces
// a sharp clip. About $0.03-0.10 per photo, runs in ~5-15s on Replicate.
//
// Trigger criteria:
//   1. Replicate API token configured
//   2. Tier is one of: "cinematic", "growth", "team", "studio" (paid plans)
//      Free + trial users skip this step (cost control)
//   3. Photo's long edge < UPSCALE_THRESHOLD_PX (default 2048)
//   4. Per-render cap (default 12 photos) — prevents runaway billing on
//      one render that uploads 50 thumbnails
//
// Model: Real-ESRGAN via nightmareai/real-esrgan. Other strong options:
//   - jingyunliang/swinir          (slower, very clean)
//   - philz1337x/clarity-upscaler  (Magnific-style, much pricier)
// Pick configurable via REPLICATE_UPSCALE_MODEL env var.
//
// Failure mode: any error returns the original buffer unchanged. Render
// proceeds with the un-upscaled photo. We log the failure for cost-tracking.

const REPLICATE_API_BASE = "https://api.replicate.com/v1";
const REPLICATE_POLL_INTERVAL_MS = 2500;
const REPLICATE_POLL_TIMEOUT_MS = 75000; // 75s per upscale (most finish in 5-15s)

// Default Real-ESRGAN. Pinned version hash for reproducibility — bump
// after testing a new release. Pin via REPLICATE_UPSCALE_VERSION env to
// override without code change.
const DEFAULT_UPSCALE_MODEL = "nightmareai/real-esrgan";
const DEFAULT_UPSCALE_VERSION =
  process.env.REPLICATE_UPSCALE_VERSION ||
  "350d32041630ffbe63c8352783a26d94126809164e54085352f8326e53999085";

// Trigger thresholds — tuned for real-estate photo workflows.
const UPSCALE_THRESHOLD_PX = Number(process.env.REPLICATE_UPSCALE_THRESHOLD_PX || 2048);
const UPSCALE_PER_RENDER_CAP = Number(process.env.REPLICATE_UPSCALE_PER_RENDER_CAP || 12);
const UPSCALE_FACTOR = Number(process.env.REPLICATE_UPSCALE_FACTOR || 4);

// Tiers eligible for AI upscale. Trial / free are excluded for cost control —
// the upscale adds ~$0.05 per photo × 24 photos = $1.20 to a render that
// might be 30¢ in Runway costs. Reserved for paid plans.
const ELIGIBLE_TIERS = new Set([
  "cinematic",
  "growth",
  "team",
  "studio",
  "agency",
  "enterprise"
]);

export function isUpscaleEligibleTier(tier) {
  if (!tier) return false;
  return ELIGIBLE_TIERS.has(String(tier).toLowerCase().trim());
}

export function shouldUpscale({ tier, longEdgePx, currentRenderUpscaleCount }) {
  if (!process.env.REPLICATE_API_TOKEN) return { shouldUpscale: false, reason: "no_replicate_token" };
  if (!isUpscaleEligibleTier(tier)) return { shouldUpscale: false, reason: `tier_${tier}_not_eligible` };
  if (longEdgePx >= UPSCALE_THRESHOLD_PX) return { shouldUpscale: false, reason: `long_edge_${longEdgePx}_above_threshold_${UPSCALE_THRESHOLD_PX}` };
  if (currentRenderUpscaleCount >= UPSCALE_PER_RENDER_CAP) return { shouldUpscale: false, reason: `per_render_cap_${UPSCALE_PER_RENDER_CAP}_reached` };
  return { shouldUpscale: true, reason: "eligible" };
}

/* ============================================================
   upscalePhotoUrl — main entry, takes a photo URL, returns URL of upscaled
   ============================================================
   Input: source photo URL (Supabase Storage, Unsplash, etc.)
   Output: { upscaledUrl, modelVersion, scaleFactor, replicateId, durationMs }
            or throws on hard failure
*/
export async function upscalePhotoUrl(sourceUrl, options = {}) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN not configured");
  }
  const startedAt = Date.now();
  const version = options.version || DEFAULT_UPSCALE_VERSION;
  const scale = Number(options.scale || UPSCALE_FACTOR);
  const faceEnhance = options.faceEnhance ?? false; // false for real-estate (no faces in shots)

  // Submit prediction
  const submitRes = await fetch(`${REPLICATE_API_BASE}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      version,
      input: {
        image: sourceUrl,
        scale,
        face_enhance: faceEnhance
      }
    })
  });

  if (!submitRes.ok) {
    const body = await submitRes.text().catch(() => "");
    throw new Error(`Replicate submit failed (HTTP ${submitRes.status}): ${body.slice(0, 200)}`);
  }
  const submitJson = await submitRes.json();
  const predictionId = submitJson.id;
  if (!predictionId) throw new Error("Replicate submit returned no prediction id");

  // Poll for completion
  const deadline = Date.now() + REPLICATE_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(REPLICATE_POLL_INTERVAL_MS);
    const pollRes = await fetch(`${REPLICATE_API_BASE}/predictions/${predictionId}`, {
      headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` }
    });
    if (!pollRes.ok) {
      const body = await pollRes.text().catch(() => "");
      throw new Error(`Replicate poll failed (HTTP ${pollRes.status}): ${body.slice(0, 200)}`);
    }
    const data = await pollRes.json();
    if (data.status === "succeeded") {
      // output is typically a string URL; some models return arrays
      const upscaledUrl = Array.isArray(data.output) ? data.output[0] : data.output;
      if (!upscaledUrl || typeof upscaledUrl !== "string") {
        throw new Error("Replicate succeeded but output URL missing");
      }
      return {
        upscaledUrl,
        modelVersion: version,
        scaleFactor: scale,
        replicateId: predictionId,
        durationMs: Date.now() - startedAt
      };
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Replicate prediction ${data.status}: ${data.error || "no error message"}`);
    }
    // status === "starting" or "processing" → continue polling
  }
  throw new Error(`Replicate prediction timed out after ${REPLICATE_POLL_TIMEOUT_MS}ms`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
