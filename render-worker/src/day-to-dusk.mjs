// EstateMotion — Day-to-Dusk twilight conversion (v23).
//
// Converts a daytime exterior real-estate shot into a warm twilight scene
// with glowing interior lights. This is a signature premium feature —
// the resulting hero shot is the most engaging real-estate visual:
// blue/orange sky, lit windows, ambient outdoor lighting.
//
// Why it matters: most photographers don't shoot dusk (it requires an
// extra trip + tripod + bracketing). Agents who can produce a "twilight
// magic" shot from their daytime listing photo can outmarket agents who
// can't. This is the kind of feature an agent tells other agents about.
//
// Implementation: SDXL img2img on Replicate with a curated prompt + low
// denoising strength (0.5) so the composition is preserved while lighting
// is transformed. Swap in alternate models via REPLICATE_DUSK_VERSION env.
//
// Cost: ~$0.04 per call on SDXL. Premium tier only — gated in
// shouldRunDayToDusk().
//
// Trigger criteria:
//   1. manifest.creative.twilightHero === true (UI toggle)
//   2. REPLICATE_API_TOKEN configured
//   3. User on a tier that includes the feature (Cinematic+ / Growth+)
//
// Failure mode: returns null. Calling code keeps the original hero photo.

const REPLICATE_API_BASE = "https://api.replicate.com/v1";
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 90 * 1000; // 90s

// SDXL img2img — pinned version. Override via REPLICATE_DUSK_VERSION.
const DEFAULT_DUSK_VERSION =
  process.env.REPLICATE_DUSK_VERSION ||
  "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc";

// Curated prompt — tuned across many real-estate exteriors. The
// "ultra detailed, real estate photography" anchors it to the listing-
// shot aesthetic so the dusk version still looks like a property photo,
// not an oil painting.
const DUSK_PROMPT =
  "exterior of a beautiful luxury real estate property at twilight, warm yellow interior lights glowing through windows, golden hour sky with deep blue and orange clouds, magic hour cinematic real estate photography, ambient outdoor lighting, atmospheric, photorealistic, ultra detailed, dusk, blue hour, lit landscape, professional real estate listing photo";
const DUSK_NEGATIVE_PROMPT =
  "daytime, bright sunlight, midday, high noon, harsh shadows, dark windows, unlit interior, oversaturated, painted, illustration, cartoon, low quality, blurry, distorted architecture, missing windows, extra walls";

// Tiers eligible for Day-to-Dusk. Same set as upscale plus we explicitly
// gate on the manifest flag — this is an opt-in feature, not always-on.
const ELIGIBLE_TIERS = new Set([
  "cinematic",
  "growth",
  "team",
  "studio",
  "agency",
  "enterprise"
]);

export function shouldRunDayToDusk({ manifest, tier }) {
  if (!manifest?.creative?.twilightHero) return { run: false, reason: "not_requested" };
  if (!process.env.REPLICATE_API_TOKEN) return { run: false, reason: "no_replicate_token" };
  if (!tier || !ELIGIBLE_TIERS.has(String(tier).toLowerCase().trim())) {
    return { run: false, reason: `tier_${tier}_not_eligible` };
  }
  return { run: true, reason: "eligible" };
}

/* ============================================================
   convertHeroToDusk — main entry
   ============================================================
   Input: source photo URL (must be publicly fetchable by Replicate).
   Returns: { duskUrl, modelVersion, replicateId, durationMs } on success.
   Throws on hard failure (caller catches and falls back to original).
*/
export async function convertHeroToDusk(sourceUrl, options = {}) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN not configured");
  }
  const startedAt = Date.now();
  const version = options.version || DEFAULT_DUSK_VERSION;
  const denoisingStrength = Number(options.denoisingStrength ?? 0.50); // 0.5 keeps architecture, transforms lighting
  const guidanceScale = Number(options.guidanceScale ?? 7.5);
  const numSteps = Number(options.numSteps ?? 35);
  const seed = options.seed != null ? Number(options.seed) : Math.floor(Math.random() * 2 ** 31);

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
        prompt: options.prompt || DUSK_PROMPT,
        negative_prompt: options.negativePrompt || DUSK_NEGATIVE_PROMPT,
        prompt_strength: denoisingStrength,
        num_inference_steps: numSteps,
        guidance_scale: guidanceScale,
        seed,
        scheduler: "K_EULER_ANCESTRAL",
        refine: "expert_ensemble_refiner",
        high_noise_frac: 0.8
      }
    })
  });
  if (!submitRes.ok) {
    const body = await submitRes.text().catch(() => "");
    throw new Error(`Replicate dusk submit failed (HTTP ${submitRes.status}): ${body.slice(0, 200)}`);
  }
  const submitJson = await submitRes.json();
  const predictionId = submitJson.id;
  if (!predictionId) throw new Error("Replicate dusk submit returned no prediction id");

  // Poll for completion
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const pollRes = await fetch(`${REPLICATE_API_BASE}/predictions/${predictionId}`, {
      headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` }
    });
    if (!pollRes.ok) {
      const body = await pollRes.text().catch(() => "");
      throw new Error(`Replicate dusk poll failed (HTTP ${pollRes.status}): ${body.slice(0, 200)}`);
    }
    const data = await pollRes.json();
    if (data.status === "succeeded") {
      const duskUrl = Array.isArray(data.output) ? data.output[0] : data.output;
      if (!duskUrl || typeof duskUrl !== "string") {
        throw new Error("Replicate dusk succeeded but output URL missing");
      }
      return {
        duskUrl,
        modelVersion: version,
        replicateId: predictionId,
        seed,
        denoisingStrength,
        durationMs: Date.now() - startedAt
      };
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Replicate dusk prediction ${data.status}: ${data.error || "no error message"}`);
    }
  }
  throw new Error(`Replicate dusk prediction timed out after ${POLL_TIMEOUT_MS}ms`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
