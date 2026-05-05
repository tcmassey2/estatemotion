# EstateMotion Production Deployment

Single source of truth for getting EstateMotion from a working repo to a live, revenue-producing service.

If something looks broken after deploying, hit `https://YOUR-DOMAIN/api/health` first. That endpoint reports exactly which env vars are missing and probes the render worker for you.

---

## Architecture (live, end-to-end)

```
User browser
   |
   v
Vercel (estatemotion.vercel.app)         <-- frontend + /api routes
   |
   |  POST /api/render { manifest }
   v
Render.com (estatemotion-worker)         <-- Express + Remotion + (later) Runway
   |
   |  HTTP image fetch
   v
Supabase Storage (listing-photos)        <-- durable photo URLs
   |
   |  Upload final MP4 + thumbnail
   v
Supabase Storage (generated-videos)
   |
   v
Public mp4Url returned to browser
```

Three services, one auth mechanism (Supabase JWT), one shared secret between Vercel and the worker.

---

## Prerequisites

You should already have accounts at:

- **Vercel** (frontend hosting + serverless `/api/*` functions)
- **Supabase** (auth, database, storage)
- **Render.com** (the long-running render worker)
- **GitHub** (source control, connected to Vercel + Render for auto-deploy)
- **OpenAI** (Motion Director — paid account with API access)
- **Stripe** (billing — set up later, not required for first live render)
- **Runway** (Cinematic AI tier — set up after Quick Reel works)

---

## Step 1 — Supabase setup

1. In your Supabase project, go to **Storage** and create two buckets:
   - `listing-photos` — public read enabled (or signed URLs with 48h TTL)
   - `generated-videos` — public read enabled
2. Apply the SQL in `supabase/seed.sql` (Database → SQL Editor) to set up the projects/photos/generated_videos tables.
3. From Project Settings → API, copy:
   - Project URL (`SUPABASE_URL`)
   - `anon` public key (`SUPABASE_ANON_KEY`)
   - `service_role` secret key (`SUPABASE_SERVICE_ROLE_KEY`) — NEVER paste this anywhere except the render worker's env vars

---

## Step 2 — Deploy the render worker to Render.com

1. In Render.com, click **New → Web Service**
2. Connect your GitHub repo
3. Set the **Root Directory** to `render-worker`
4. Set the **Dockerfile Path** to `render-worker/Dockerfile`
5. Set **Environment** to `Docker`
6. Choose at least **Standard** plan ($25/mo) — Remotion needs ~2GB RAM. The Starter plan WILL OOM during render.
7. Add environment variables:

   | Key | Value |
   | --- | --- |
   | `PORT` | `8787` |
   | `RENDER_WORKER_SECRET` | Generate a random 32-char string. Save it. |
   | `RENDER_WORKER_PUBLIC_URL` | Your Render service URL once it's created (e.g. `https://estatemotion-worker.onrender.com`) |
   | `SUPABASE_URL` | From Step 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | From Step 1 — service role, not anon |
   | `SUPABASE_GENERATED_VIDEOS_BUCKET` | `generated-videos` |
   | `OPENAI_API_KEY` | Your OpenAI key (only if you want worker-side fallback; otherwise optional) |

8. Click **Create Web Service**. First build takes 5–10 minutes (Docker + node_modules + Remotion deps).
9. Once deployed, hit `https://YOUR-WORKER-URL/health` in a browser. You should see `{"ok": true, "service": "EstateMotion Remotion worker"}`.

---

## Step 3 — Configure Vercel env vars

In Vercel → your project → Settings → Environment Variables, add (for **Production** environment):

| Key | Value | Why |
| --- | --- | --- |
| `SUPABASE_URL` | From Step 1 | Used by `/api/env` and frontend Supabase client |
| `SUPABASE_ANON_KEY` | From Step 1 | Frontend auth |
| `OPENAI_API_KEY` | Your OpenAI key | `/api/create-edit-plan` Motion Director |
| `OPENAI_MOTION_MODEL` | `gpt-4.1-mini` | Vision-capable, cost-efficient |
| `RENDER_WORKER_URL` | Your Render service URL from Step 2 | Where `/api/render` forwards manifests |
| `RENDER_WEBHOOK_SECRET` | Same string as `RENDER_WORKER_SECRET` from Step 2 | Auth between Vercel and worker |
| `LISTING_PHOTOS_BUCKET` | `listing-photos` | Photo upload destination |

You do NOT need to set `MOCK_*` flags. As of the new `/api/env.js`, mock mode auto-detects from key presence: once these are set, mock mode turns off automatically.

After saving, redeploy (Deployments → latest → Redeploy) so the new env vars take effect.

---

## Step 4 — Verify with /api/health

In a browser, open `https://estatemotion.vercel.app/api/health`. You should see:

```json
{
  "productionReady": true,
  "summary": "All required subsystems configured. Live rendering should work.",
  "mode": {
    "MOCK_AI": false,
    "MOCK_RENDERING": false,
    "MOCK_SUPABASE": false,
    "MOCK_STRIPE": true
  },
  "subsystems": {
    "supabase": { "ready": true, ... },
    "openaiMotionDirector": { "ready": true, ... },
    "renderWorker": { "ready": true, ... },
    "stripe": { "ready": false, ... },
    "runway": { "ready": false, ... }
  },
  "workerCheck": { "ok": true, "status": 200 }
}
```

If anything in `subsystems.*.ready` is `false`, the `summary` and `missing` fields will tell you exactly what to fix.

If `workerCheck.ok` is `false`, the URL is wrong or the worker is down. Check Render.com logs.

`stripe` and `runway` being `ready: false` is fine for now — they're not required for first live render.

---

## Step 5 — First live render

1. Open `https://estatemotion.vercel.app` in an incognito window
2. Click "Start free trial" — sign up with a real email
3. Confirm the email if Supabase requires it
4. Upload 8–12 real listing photos
5. Walk through to Export → Generate Video
6. Watch the progress UI. The job should go: queued → rendering → completed.
7. Total time: ~2–4 minutes for a 45–60 second Quick Reel
8. The completed page should show a real `mp4Url` you can download

If it fails, the in-app error and the network tab on `/api/render` and `/api/render?jobId=...` will tell you which subsystem broke. Cross-check with `/api/health`.

---

## Step 6 — Cinematic AI tier with Runway

Once Quick Reel is working live (Step 5), add the Runway-powered Cinematic AI tier:

1. Get a Runway API key at `dev.runwayml.com` → API Keys. Fund $50–100 to start (each Cinematic AI render costs ~$3 in Runway credits at 12 photos × 5s).
2. Add these env vars to the **Render.com worker** (NOT Vercel — the worker calls Runway directly):

   | Key | Value | Notes |
   | --- | --- | --- |
   | `RUNWAY_API_KEY` | Your Runway API key | Required |
   | `RUNWAY_MODEL` | `gen3a_turbo` | Default; the only currently-supported model |
   | `RUNWAY_CONCURRENCY` | `4` | Parallel Runway calls per render. Higher = faster but more API pressure. |
   | `RUNWAY_MUSIC_LUXURY_URL` | https URL to MP3 | Optional. Music for Luxury style renders. |
   | `RUNWAY_MUSIC_VIRAL_URL` | https URL to MP3 | Optional. Music for Modern Social. |

3. Redeploy the worker (Render.com → Manual Deploy).
4. Hit `https://YOUR-DOMAIN/api/health` — `subsystems.runway.ready` should be `true`.
5. Health probe also confirms `ffmpeg` is available in the worker container (it's in the Dockerfile, so it should always be).

### How the engine routing works

Each render manifest carries an `engine` field. The frontend sets it based on the user's tier and choice:

- `engine: "remotion"` — fast, cheap, photo-animation. Quick Reel tier.
- `engine: "runway"` — slow, expensive, true AI motion. Cinematic AI / Cinematic AI 4K tiers.

The worker's `dispatchRender()` routes accordingly. Same async pattern, same Supabase upload, same `mp4Url` returned to the browser — just a different generation backend.

### Cost guardrail

`runway-job.mjs` enforces a `MAX_SCENES = 30` cap per render to prevent runaway billing. At 30 scenes × 5s × $0.05/s, the worst-case Runway cost per render is **$7.50**. Quick Reel renders incur $0 in Runway costs.

---

## Step 7 — Stripe + tier system

This is the revenue layer. Don't enable until Step 5 (Quick Reel live render) is verified working.

### 7a. Apply the subscription schema

In Supabase Dashboard → SQL Editor, paste and run `supabase/migrations/02_subscriptions.sql`. This creates:

- `public.profiles` — one row per `auth.users`, holds `tier`, `monthly_video_quota`, `videos_used_this_month`, Stripe linkage
- `public.tier_plans` — reference table with the four tiers and their quotas/features
- `public.render_usage` — per-render audit log
- `public.get_user_tier_state(user_id)` — RPC the API calls to check quota before each render
- A trigger that auto-creates a profile row when a new user signs up

Verify with: `select * from public.tier_plans order by sort_order;` — you should see four rows.

### 7b. Stripe setup

1. In Stripe Dashboard, create three recurring products:
   - **Quick Reel** — $79.00/month (USD, recurring monthly)
   - **Cinematic AI** — $149.00/month
   - **Cinematic AI 4K** — $299.00/month
2. For each, copy the `price_…` ID (NOT the `prod_…` ID) into Vercel env vars.
3. Configure a webhook at Stripe Dashboard → Developers → Webhooks:
   - Endpoint: `https://YOUR-DOMAIN/api/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy the webhook signing secret (starts with `whsec_…`)

### 7c. Vercel env vars (add these)

| Key | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_live_…` (or `sk_test_…` while staging) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from step 7b |
| `STRIPE_PRICE_QUICK_REEL` | `price_…` for $79 tier |
| `STRIPE_PRICE_CINEMATIC_AI` | `price_…` for $149 tier |
| `STRIPE_PRICE_CINEMATIC_4K` | `price_…` for $299 tier |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_…` (frontend) |
| `APP_URL` | `https://estatemotion.vercel.app` |

Redeploy. `/api/health` should now show `subsystems.stripe.ready: true`.

### 7d. How the tier guard works

Every call to `POST /api/render` runs through `enforceTierGuard()`:

1. Extracts `Authorization: Bearer <Supabase JWT>` from the request
2. Verifies the JWT with Supabase Auth (`/auth/v1/user`)
3. Calls the `get_user_tier_state(user_id)` RPC
4. Blocks the render with HTTP 402 if `videos_used_this_month >= monthly_video_quota` or if subscription is `past_due` / `canceled`
5. Blocks `engine: "runway"` requests for users not on Cinematic AI tier or higher

Anonymous requests (no JWT) can render Quick Reel only — useful for the demo flow where users aren't yet signed in. The Runway path is fully gated behind a paying tier.

---

## Troubleshooting cheat sheet

| Symptom | Most likely cause | Fix |
| --- | --- | --- |
| "Video rendering is not connected yet" | `RENDER_WORKER_URL` not set on Vercel | Step 3 |
| Spinner never advances past "queued" | Worker is up but secret mismatch | Verify `RENDER_WORKER_SECRET` (Render) === `RENDER_WEBHOOK_SECRET` (Vercel) |
| "Motion Director unavailable: missing OPENAI_API_KEY" | OpenAI key not set | Step 3 |
| Photos upload but render says "missing durableUrl" | Supabase service role key missing on worker | Step 2, env vars |
| Render starts then fails with OOM | Worker on Render Starter plan | Upgrade to Standard ($25/mo) |
| `/api/health` shows `productionReady: true` but live site still broken | Browser cache | Hard reload, or open incognito |

When in doubt: `/api/health`. It exists for exactly this reason.
