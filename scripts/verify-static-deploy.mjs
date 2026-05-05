import { access, readFile } from "node:fs/promises";

// Verify the bare minimum of files needed for the deployment to make sense.
// The new /app/ surface is built by Vite and lives at /app/dist/ after build,
// so we only check the SOURCE files here (not the build output).

const requiredFiles = [
  // Marketing landing
  "index.html",
  "landing.css",
  "landing.js",

  // App (Vite + React + TypeScript)
  "app/package.json",
  "app/index.html",
  "app/src/main.tsx",
  "app/src/App.tsx",
  "app/src/lib/store.ts",
  "app/src/lib/supabase.ts",
  "app/src/lib/api.ts",
  "app/src/lib/types.ts",
  "app/src/screens/AuthScreen.tsx",
  "app/src/screens/DashboardScreen.tsx",
  "app/src/screens/ProjectScreen.tsx",
  "app/vite.config.ts",
  "app/tsconfig.json",
  "app/tailwind.config.js",
  "app/postcss.config.js",

  // API routes (Vercel serverless functions)
  "api/env.js",
  "api/health.js",
  "api/render.js",
  "api/classify-image.js",
  "api/create-edit-plan.js",
  "api/usage.js",
  "api/create-checkout-session.js",
  "api/stripe-webhook.js",

  // Supabase schema
  "supabase/schema.sql",
  "supabase/seed.sql",
  "supabase/migrations/02_subscriptions.sql",
  "supabase/migrations/03_storage_policies.sql",

  // Render worker
  "render-worker/server.mjs",
  "render-worker/Dockerfile",
  "render-worker/src/render-job.mjs",
  "render-worker/src/runway-job.mjs",

  // Config
  "vercel.json",
  "docs/PRODUCTION_DEPLOYMENT.md"
];

for (const file of requiredFiles) {
  await access(file);
}

JSON.parse(await readFile("vercel.json", "utf8"));
JSON.parse(await readFile("package.json", "utf8"));
JSON.parse(await readFile("app/package.json", "utf8"));

console.log(`EstateMotion static deploy check passed: ${requiredFiles.length} files present.`);
