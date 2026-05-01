# EstateMotion Render Worker

This package is the Remotion MP4 renderer for EstateMotion. It is intentionally separate from the root static app so Vercel can keep deploying the browser MVP without installing React, Remotion, or Chromium rendering dependencies.

## Local Setup

```bash
cd render-worker
npm install
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
SUPABASE_GENERATED_VIDEOS_BUCKET=generated-videos \
RENDER_WORKER_SECRET=replace-me \
npm run start
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

`npm run render:sample` renders six local Marketing OS MP4s into `render-worker/out/marketing-os`:

- Listing Reel
- Seller Lead Magnet
- Investor Deal Breakdown
- Wholesale Opportunity
- Neighborhood Spotlight
- Agent Brand

The sample harness serves generated durable test images over a localhost HTTP server so the renderer exercises production-like image URLs instead of browser-only `blob:` or blocked `file:` URLs.

The static app calls `/api/render`. The Vercel function then forwards the manifest to this worker at `RENDER_WORKER_URL`.

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
