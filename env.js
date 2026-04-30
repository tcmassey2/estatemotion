window.ESTATEMOTION_ENV = {
  MOCK_AI: true,
  MOCK_RENDERING: true,
  MOCK_STRIPE: true,
  MOCK_SUPABASE: true,
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  OPENAI_ENDPOINT: "",
  STRIPE_PUBLISHABLE_KEY: "",
  STRIPE_CHECKOUT_ENDPOINT: "",
  RENDER_ENDPOINT: "",
  SUPABASE_JS_URL: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm",
  ...(window.ESTATEMOTION_ENV ?? {})
};
