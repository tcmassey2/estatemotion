export default function handler(request, response) {
  response.setHeader("Content-Type", "application/javascript; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.status(200).send(`window.ESTATEMOTION_ENV = ${JSON.stringify(publicEnv())};`);
}

function publicEnv() {
  return {
    MOCK_AI: readFlag("MOCK_AI", true),
    MOCK_RENDERING: readFlag("MOCK_RENDERING", true),
    MOCK_STRIPE: readFlag("MOCK_STRIPE", true),
    MOCK_SUPABASE: readFlag("MOCK_SUPABASE", true),
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
    OPENAI_ENDPOINT: process.env.OPENAI_ENDPOINT || "",
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    STRIPE_CHECKOUT_ENDPOINT: process.env.STRIPE_CHECKOUT_ENDPOINT || "",
    RENDER_ENDPOINT: process.env.RENDER_ENDPOINT || "",
    SUPABASE_JS_URL: process.env.SUPABASE_JS_URL || "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
  };
}

function readFlag(key, fallback) {
  const value = process.env[key];
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === "true" || value === "1";
}
