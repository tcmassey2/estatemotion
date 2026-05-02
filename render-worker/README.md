# EstateMotion Render Worker

This package is the Remotion MP4 renderer for EstateMotion. It is intentionally separate from the root static app so Vercel can keep deploying the browser MVP without installing React, Remotion, or Chromium rendering dependencies.

## Local Setup

### Supported local runtime

On a normal development machine, use Node.js 20+ with `npm`:

```bash
cd render-worker
npm ci
npm run check
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
SUPABASE_GENERATED_VIDEOS_BUCKET=generated-videos \
RENDER_WORKER_SECRET=replace-me \
npm run start
```

In the Codex desktop workspace used for this project, `npm` is not on `PATH` and the Codex.app embedded Node cannot load the Remotion/Rspack native binding. Use the bundled workspace Node directly:

```bash
export CODEX_NODE="/Users/troymassey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
cd render-worker
$CODEX_NODE --check src/render-job.mjs
$CODEX_NODE --check server.mjs
$CODEX_NODE --check render-local.mjs
$CODEX_NODE --check render-openai-plan.mjs
$CODEX_NODE --check verify-async-render.mjs
PORT=8787 $CODEX_NODE server.mjs
```

Health check:

```bash
curl http://localhost:8787/health
```

Worker checks:

```bash
npm run check
npm run render:sample
```

Codex workspace equivalent:

```bash
$CODEX_NODE render-openai-plan.mjs
```

## Async Render Verification

With the worker running locally:

```bash
cd render-worker
export CODEX_NODE="/Users/troymassey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
RENDER_WORKER_URL=http://localhost:8787 $CODEX_NODE verify-async-render.mjs
```

This creates:

- `out/async-verification/professional-listing-video.manifest.json`
- `out/async-verification/downloaded-professional-listing-video.mp4`
- `out/async-verification/downloaded-thumbnail.png`
- `out/async-verification/verification.json`

The verification submits a real async job and confirms:

- `queued -> rendering -> completed`
- completed response includes `mp4Url`
- MP4 is downloadable
- expected duration is 45-60 seconds
- intro card, property stat card, photo scenes, and branded outro are included
- camera motion and transition metadata are present

Verified locally on May 1, 2026 with:

- duration: `54.955s`
- scenes: `18`
- photo scenes: `16`
- output size: `15 MB`
- MP4 URL: worker-served `/render/assets/:jobId/estate-motion.mp4`

`npm run render:sample` renders six local Marketing OS MP4s into `render-worker/out/marketing-os`:

- Listing Reel
- Seller Lead Magnet
- Investor Deal Breakdown
- Wholesale Opportunity
- Neighborhood Spotlight
- Agent Brand

The sample harness serves generated durable test images over a localhost HTTP server so the renderer exercises production-like image URLs instead of browser-only `blob:` or blocked `file:` URLs.

The static app calls `/api/render`. The Vercel function then forwards the manifest to this worker at `RENDER_WORKER_URL`.

## Docker Deploy

Use Docker when the local machine does not have a working Node/npm runtime:

```bash
cd render-worker
docker build -t estatemotion-render-worker .
docker run --rm -p 8787:8787 \
  -e PORT=8787 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  -e SUPABASE_GENERATED_VIDEOS_BUCKET=generated-videos \
  -e RENDER_WORKER_SECRET=replace-me \
  estatemotion-render-worker
```

For local verification without Supabase upload, omit the Supabase variables. The worker will return a temporary worker-served `mp4Url` for the rendered file.

## Required Runtime Env

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_GENERATED_VIDEOS_BUCKET`, defaults to `generated-videos`
- `RENDER_WORKER_SECRET`, optional but recommended
- `PORT`, defaults to `8787`

## Frontend / Vercel Env

Set these on the static Vercel project:

```bash
MOCK_RENDERING=false
RENDER_WORKER_URL=https://your-render-worker.example.com
RENDER_WEBHOOK_SECRET=replace-me
```

`RENDER_WORKER_URL` can be either the worker base URL or the full `/render` endpoint.

## Current Rendering Scope

The worker renders one reliable full-property MP4 from the EstateMotion render manifest:

- ordered listing photo scenes
- real estate scene labels
- hook and overlay text
- feature cards
- beat-paced durations
- camera motion plan
- brand end card
- compliance footer
- Marketing OS overlays for seller, investor, wholesale, neighborhood, and agent-brand modes
- MP4 plus thumbnail upload to Supabase Storage

Live rendering requires public/Supabase image URLs. Browser `blob:` URLs from pure local mock uploads cannot be rendered by a remote worker; keep `MOCK_RENDERING=true` for fully local demos.

Safe fallbacks are included for missing agent name, brokerage, neighborhood, headshot/logo, ARV, and rehab estimate. Investor and wholesale overlays label figures as estimates, and seller preview language avoids guaranteed sale-price claims.
