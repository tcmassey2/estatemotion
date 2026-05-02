import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "app.js",
  "styles.css",
  "app/index.html",
  "demo/index.html",
  "beta/index.html",
  "api/env.js",
  "api/classify-image.js",
  "api/create-edit-plan.js",
  "lib/reel/demoFixtures.js",
  "vercel.json",
  "supabase/schema.sql",
  "supabase/seed.sql",
  "README.md",
  "DEPLOY_CHECKLIST.md"
];

for (const file of requiredFiles) {
  await access(file);
}

JSON.parse(await readFile("vercel.json", "utf8"));
JSON.parse(await readFile("package.json", "utf8"));

console.log(`EstateMotion static deploy check passed: ${requiredFiles.length} files present.`);
