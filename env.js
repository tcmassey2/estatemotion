// Static fallback config for EstateMotion's frontend. The PRIMARY config source
// is /api/env (which auto-detects mock mode from server env vars). This file
// only takes effect if /api/env fails to load — typically in pure-static dev
// (python http.server, GitHub Pages, etc.). In that case we default to "live"
// and let the app surface real errors, rather than silently masking them with
// mock mode.
//
// To force mock mode for local UI work without a backend, append
// ?MOCK_RENDERING=true&MOCK_SUPABASE=true&MOCK_AI=true to the URL.
window.ESTATEMOTION_ENV = {
  MOCK_AI: false,
  MOCK_RENDERING: false,
  MOCK_STRIPE: true, // Stripe billing is opt-in; mock until configured
  MOCK_SUPABASE: false,
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  LISTING_PHOTOS_BUCKET: "listing-photos",
  SUPABASE_STORAGE_PRIVATE: false,
  SUPABASE_SIGNED_URL_TTL_SECONDS: 172800,
  OPENAI_ENDPOINT: "",
  VISION_CLASSIFICATION_ENDPOINT: "/api/classify-image",
  CREATE_EDIT_PLAN_ENDPOINT: "/api/create-edit-plan",
  MUSIC_LUXURY_URL: "",
  MUSIC_VIRAL_URL: "",
  MUSIC_MLS_CLEAN_URL: "",
  MUSIC_INVESTOR_URL: "",
  STRIPE_PUBLISHABLE_KEY: "",
  STRIPE_CHECKOUT_ENDPOINT: "",
  RENDER_ENDPOINT: "",
  SUPABASE_JS_URL: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm",
  ...(window.ESTATEMOTION_ENV ?? {})
};
