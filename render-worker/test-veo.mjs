// EstateMotion v25 Phase 1 — Veo smoke-test runner.
//
// Hits the worker's POST /test/veo endpoint with one Supabase image URL
// + one motion prompt and prints the resulting clip URL on success. The
// intent is to validate Veo 3.1 Fast end-to-end before flipping any
// production routing.
//
// USAGE
//   WORKER_URL=https://estatemotion-worker.onrender.com \
//     node test-veo.mjs \
//       --image https://your-supabase-url.supabase.co/.../kitchen.jpg \
//       --prompt "Slow cinematic dolly toward the kitchen island. Subtle 6% zoom. No camera shake. Preserve cabinetry and appliance hardware exactly." \
//       --aspect 9:16 \
//       --duration 5
//
//   # Or, if you have a local worker running:
//   WORKER_URL=http://127.0.0.1:8787 node test-veo.mjs --image ... --prompt ...
//
// PREREQS (on the worker side)
//   GOOGLE_APPLICATION_CREDENTIALS_JSON  - raw service-account JSON in env var
//   GOOGLE_CLOUD_PROJECT                 - GCP project ID
//   VEO_OUTPUT_GCS_BUCKET                - gs://your-veo-output-bucket
//   GOOGLE_CLOUD_LOCATION                - default "global" (optional)
//
// The worker bootstrap writes the SA JSON to /tmp/gcp-sa.json at boot
// and points GOOGLE_APPLICATION_CREDENTIALS at it. Vertex AI's ADC
// picks it up automatically.

const args = parseArgs(process.argv.slice(2));
if (!args.image || !args.prompt) {
  console.error(
    "Missing required flags. Usage:\n" +
      "  node test-veo.mjs --image <url> --prompt <text> [--aspect 9:16] [--duration 5]"
  );
  process.exit(1);
}

const workerUrl = (process.env.WORKER_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const body = {
  imageUrl: args.image,
  prompt: args.prompt,
  aspectRatio: args.aspect || "9:16",
  duration: Number(args.duration) || 5
};

console.log(`POST ${workerUrl}/test/veo`);
console.log("Body:", { ...body, prompt: body.prompt.slice(0, 80) + "..." });
const startedAt = Date.now();

const res = await fetch(`${workerUrl}/test/veo`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

const json = await res.json().catch(() => ({}));
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

if (!res.ok || json.status !== "ok") {
  console.error(`\n❌ Veo smoke test FAILED in ${elapsed}s`);
  console.error("HTTP", res.status, json);
  process.exit(2);
}

console.log(`\n✅ Veo smoke test PASSED in ${elapsed}s`);
console.log("Clip:        ", `${workerUrl}${json.clipServePath}`);
console.log("GCS URI:     ", json.gcsUri);
console.log("Veo op:      ", json.veoOpName);
console.log("Notes:       ", json.notes);
console.log("\nOpen the Clip URL in a browser to inspect the result.");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!flag.startsWith("--")) continue;
    const key = flag.slice(2);
    const val = argv[i + 1];
    if (!val || val.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = val;
      i++;
    }
  }
  return out;
}
