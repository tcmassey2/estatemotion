// EstateMotion — ElevenLabs voice catalog (v23).
//
// A curated set of ElevenLabs premade voices keyed to style packs +
// product use cases. Surfaced in Settings so each agent can pick a
// narrator that matches their brand (energetic Bella for Viral pack,
// warm Sarah for Luxury, deep Drew for Investor).
//
// Voice settings (stability / similarity / style) are tuned per voice
// because voices respond differently to the same numeric values. The
// numbers below were chosen to give each voice a "professional broadcast
// narrator" quality without the flat, robotic feel of style=0 OR the
// over-acted feel of style=0.7+.
//
// The legacy default of style=0.18 produced narration that listeners
// described as "fine but characterless." Bumping to 0.35-0.45 across the
// catalog produces noticeably more inflection — what people register as
// "this voice sounds real."
//
// To add a new voice: pick from https://elevenlabs.io/voice-library, grab
// the voice ID, and add an entry below. Test by setting brandKit.voiceId
// to the slug and rendering a short reel.

// Per-style default voice — used when brandKit.voiceId is unset.
export const DEFAULT_VOICE_BY_STYLE = {
  luxury: "luxury-warm",
  viral: "viral-energetic",
  mls: "mls-neutral",
  "mls-clean": "mls-neutral",
  "mls clean": "mls-neutral",
  investor: "investor-deep"
};

// Catalog of available voices. Slug is what we expose in the UI + store
// in brandKit.voiceId. elevenLabsId is the actual ElevenLabs voice ID.
export const VOICES = [
  // -------- LUXURY pack defaults --------
  {
    slug: "luxury-warm",
    label: "Sarah — warm, refined",
    description: "Polished female narrator. Rachel's tonal cousin. Best for high-end residential.",
    elevenLabsId: "EXAVITQu4vr4xnSDxMAC", // Sarah
    gender: "female",
    accent: "American",
    settings: { stability: 0.55, similarity_boost: 0.85, style: 0.40, use_speaker_boost: true },
    bestFor: ["luxury", "investor", "mls"]
  },
  {
    slug: "luxury-male",
    label: "Adam — deep, considered",
    description: "Deep male voice. Sounds like an architectural-tour narrator.",
    elevenLabsId: "pNInz6obpgDQGcFmaJgB", // Adam
    gender: "male",
    accent: "American",
    settings: { stability: 0.60, similarity_boost: 0.85, style: 0.38, use_speaker_boost: true },
    bestFor: ["luxury", "investor"]
  },
  {
    slug: "luxury-british",
    label: "Charlotte — warm British",
    description: "Refined British female. Works for international/luxury listings.",
    elevenLabsId: "XB0fDUnXU5powFXDhCwa", // Charlotte
    gender: "female",
    accent: "British",
    settings: { stability: 0.58, similarity_boost: 0.85, style: 0.42, use_speaker_boost: true },
    bestFor: ["luxury"]
  },
  // -------- VIRAL pack defaults --------
  {
    slug: "viral-energetic",
    label: "Bella — bright, friendly",
    description: "Younger female, energetic. Built for short-form social.",
    elevenLabsId: "EXAVITQu4vr4xnSDxMAC", // Bella shares ID with Sarah in some accounts; safe fallback
    gender: "female",
    accent: "American",
    settings: { stability: 0.45, similarity_boost: 0.80, style: 0.55, use_speaker_boost: true },
    bestFor: ["viral"]
  },
  {
    slug: "viral-confident",
    label: "Domi — strong, expressive",
    description: "Female with strong presence. Punchy delivery for scroll-stopping content.",
    elevenLabsId: "AZnzlk1HvdrXVdmskN1", // Domi
    gender: "female",
    accent: "American",
    settings: { stability: 0.40, similarity_boost: 0.80, style: 0.60, use_speaker_boost: true },
    bestFor: ["viral"]
  },
  // -------- INVESTOR pack defaults --------
  {
    slug: "investor-deep",
    label: "Drew — professional, measured",
    description: "Middle-aged male, business-news cadence. For investor/commercial.",
    elevenLabsId: "29vD33N1CtxCmqQRPOHJ", // Drew
    gender: "male",
    accent: "American",
    settings: { stability: 0.62, similarity_boost: 0.85, style: 0.30, use_speaker_boost: true },
    bestFor: ["investor", "mls"]
  },
  // -------- MLS / Compliance --------
  {
    slug: "mls-neutral",
    label: "Rachel — neutral, professional",
    description: "Original default. Restrained delivery for compliance-first use.",
    elevenLabsId: "21m00Tcm4TlvDq8ikWAM", // Rachel
    gender: "female",
    accent: "American",
    settings: { stability: 0.65, similarity_boost: 0.88, style: 0.20, use_speaker_boost: true },
    bestFor: ["mls", "luxury"]
  }
];

// Build a lookup map so resolution is O(1).
const VOICES_BY_SLUG = new Map(VOICES.map((v) => [v.slug, v]));
const VOICES_BY_ELEVENLABS_ID = new Map(VOICES.map((v) => [v.elevenLabsId, v]));

// Resolve a voiceId (slug OR raw ElevenLabs ID OR null) into a complete
// voice config. Always returns a voice — falls back to the style's
// default if nothing matches, then to the catalog default.
export function resolveVoice({ voiceId, styleSlug, fallbackElevenLabsId }) {
  const tried = String(voiceId || "").trim();
  if (tried) {
    // 1. Try as slug
    if (VOICES_BY_SLUG.has(tried)) return VOICES_BY_SLUG.get(tried);
    // 2. Try as raw ElevenLabs ID
    if (VOICES_BY_ELEVENLABS_ID.has(tried)) return VOICES_BY_ELEVENLABS_ID.get(tried);
    // 3. If it looks like an ElevenLabs ID we don't know about, wrap it so
    //    custom user voices still work. Use neutral default settings.
    if (/^[a-zA-Z0-9]{20,}$/.test(tried)) {
      return {
        slug: `custom-${tried.slice(0, 8)}`,
        label: `Custom voice (${tried.slice(0, 8)}…)`,
        description: "Custom ElevenLabs voice — not in EstateMotion catalog.",
        elevenLabsId: tried,
        gender: "unknown",
        accent: "unknown",
        settings: { stability: 0.55, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true },
        bestFor: []
      };
    }
  }

  // 4. Fall back to style's default
  const styleNorm = String(styleSlug || "").trim().toLowerCase();
  const styleDefaultSlug = DEFAULT_VOICE_BY_STYLE[styleNorm];
  if (styleDefaultSlug && VOICES_BY_SLUG.has(styleDefaultSlug)) {
    return VOICES_BY_SLUG.get(styleDefaultSlug);
  }

  // 5. Last resort: catalog default (Sarah)
  if (fallbackElevenLabsId && VOICES_BY_ELEVENLABS_ID.has(fallbackElevenLabsId)) {
    return VOICES_BY_ELEVENLABS_ID.get(fallbackElevenLabsId);
  }
  return VOICES_BY_SLUG.get("luxury-warm");
}

// Public list for UI consumption (Settings dropdown).
export function getPublicVoiceCatalog() {
  return VOICES.map(({ slug, label, description, gender, accent, bestFor }) => ({
    slug,
    label,
    description,
    gender,
    accent,
    bestFor
  }));
}
