# EstateMotion

EstateMotion is a mobile-first AI real estate video creation MVP for agents who need fast, premium, branded listing content from real property photos.

This repo currently includes three surfaces:

- `app/index.html`, `index.html`, `styles.css`, `app.js`, `env.js`, `supabaseClient.js`: a deployable browser app with mock mode and Supabase mode.
- `demo/index.html`: a public founder validation landing page.
- `App.tsx` and `src/`: the Expo/React Native app scaffold using the same product model.
- `remotion/` and `backend/rendering/`: a Remotion-ready MP4 rendering path for real backend rendering.

## Working Local MVP

Run the browser MVP:

```bash
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173/app/
http://localhost:4173/demo/
```

Local static serving logs a `404` for `/api/env` because the Vercel serverless env endpoint only exists after deployment. The browser falls back to `env.js`, so this is expected locally.

## Two-Minute Demo Script

Use this sequence when showing EstateMotion to agents or partners:

1. Open the dashboard and say: "EstateMotion turns real listing photos into a complete social video content pack for agents."
2. Point to `Showcase Projects`: "For a sales demo, I can load Phoenix Starter Home, Arcadia Family Home, or Scottsdale Luxury Listing with one click."
3. Click `Demo This Project`: "The showcase loads a complete listing with photos, template, hook preset, caption tone, CTA, thumbnail, and three reel variations."
4. Show the side-by-side comparison and `Why this works`: "EstateMotion explains the Luxury, Viral, and Professional angles so the agent understands the content strategy, not just the output."
5. Tap `Project`: "The agent enters basic listing details once: address, price, neighborhood, listing type, and local market."
6. Tap `Upload Photos`: "They upload real listing photos. The MVP keeps them local, sorts them by room type, and lets the agent adjust order."
7. Tap through `Details` and `Templates`: "The AI-style copy is generated from the listing facts, and templates control pacing, transitions, captions, and CTA."
8. On `Preview`: "This is the agent-facing reel preview: real photos, clean movement, property overlays, feature cards, compliance, and a personal brand end card."
9. Tap `Brand`: "The brand kit saves name, brokerage, headshot/logo URLs, contact info, colors, CTA, and compliance disclaimers."
10. Tap `Results`: "The render queue shows queued, rendering, complete, and failed states. In mock mode it exports a manifest, preview HTML, and caption assets. In live mode `/api/render` forwards the manifest to the Remotion worker for MP4 output."
11. Close with: "The product is designed to feel less like a slideshow maker and more like a real estate content operating system for listing launches."

Demo notes:

- Use `Reset demo` before a meeting to restore the polished sample state.
- Keep `MOCK_RENDERING=true` for a reliable browser demo.
- Use the download/copy buttons on `Results` to show handoff assets.
- Use Showcase Mode when you want the demo to feel presentation-ready without uploading photos live.

## Founder Demo Checklist

Use this checklist for customer validation calls:

- Show dashboard.
- Open a Showcase Project with `Demo This Project`.
- Compare Luxury, Viral, and Professional reel variations.
- Explain the `Why this works` breakdown.
- Preview content pack.
- Export caption/hashtags.
- Ask if they would pay.

Founder validation landing page:

```text
http://localhost:4173/demo
```

The `/demo` page includes the positioning headline, three-step explanation, pricing test cards, and a `Request Early Access` form. Submissions are stored locally in the browser and can be exported as CSV from the same page.

Local analytics:

- Demo page visits
- Early access form submissions
- Pricing card clicks
- Export/download intent
- Copy caption clicks
- Copy hashtag clicks

Open `Stats` in the bottom nav to view total visits, total leads, conversion rate, most clicked pricing option, export intent count, and recent events. Analytics are local-only and can be exported as JSON from that screen.

Core journey that works locally:

```text
Dashboard -> Create Project -> Upload Photos -> Listing Details -> Choose Template -> Preview -> Edit -> Export
```

What is live in the local browser MVP v2:

- `/app` protected-product route with Supabase Auth gate when `MOCK_SUPABASE=false`
- `/demo` public landing route
- One persisted local project using `localStorage` when `MOCK_SUPABASE=true`
- Supabase table persistence when `MOCK_SUPABASE=false`
- Supabase Storage upload paths for project photos, brand headshots, logos, and generated render artifacts
- Agent onboarding for name, brokerage, headshot URL, logo URL, phone, website, email, and Instagram
- Real image uploads on web
- Filename-based AI-style photo categorization
- Manual photo ordering
- Project thumbnails on the dashboard
- Internal Showcase Mode with 3 polished sample listings, one-click demo loading, variation comparison, and strategy breakdowns
- Listing details connected to project state
- Agent brand kit connected to end card
- Compliance fields for listing courtesy, brokerage disclaimer, Equal Housing Opportunity, and MLS disclaimer
- Template selection connected to preview and render manifest
- Local AI-style copy generation for hook, highlights, caption, hashtags, and voiceover
- Premium reel preview with ordered photos, overlays, feature cards, scene inspector, compliance preview, and brand end card
- Render queue state with `queued`, `rendering`, `complete`, and `failed`
- Pricing/credits screen for Free trial, Pay-per-export, Monthly Pro, and Brokerage plan
- Environment-driven feature flags through `env.js`, query params, or localStorage
- Content Pack export for:
  - Full property reel
  - Kitchen highlight
  - Exterior curb appeal reel
  - Open house story
  - Caption + hashtags
- Export screen with downloadable JSON render manifest
- Export screen with downloadable standalone preview HTML

What is mocked locally:

- MP4 rendering, unless `MOCK_RENDERING=false` and a render endpoint is connected
- OpenAI, unless you replace local copy generation with a secure API endpoint
- Stripe Checkout and billing
- Supabase persistence and storage, only when `MOCK_SUPABASE=true`

## Deployable Web App Structure

Production routes:

```text
/demo       Public founder validation page
/app        Protected EstateMotion product app
/api/env    Vercel function that injects public runtime config
```

Key files:

- `vercel.json`: clean URL rewrites for `/app` and `/demo`.
- `api/env.js`: exposes public runtime config from Vercel environment variables.
- `supabaseClient.js`: browser Supabase Auth, table persistence, and Storage adapter.
- `supabase/schema.sql`: tables, RLS policies, and Storage bucket policies.
- `supabase/seed.sql`: initial template records.

## Vercel Deployment

1. Create a Supabase project.
2. In Supabase SQL editor, paste and run the contents of `supabase/schema.sql`.
3. In Supabase SQL editor, paste and run the contents of `supabase/seed.sql`.

4. In Supabase Auth settings, add redirect URLs:

```text
http://localhost:4173/app/
https://YOUR-VERCEL-DOMAIN.vercel.app/app/
```

5. In Vercel, import this project as a static browser MVP. The repo intentionally has no active React, Expo, or Remotion dependencies for this deploy.
6. Keep the Vercel build command as:

```bash
npm run build
```

This runs `scripts/verify-static-deploy.mjs`, which only checks that the static MVP files are present.
7. Add Vercel environment variables:

```text
MOCK_SUPABASE=false
MOCK_AI=true
MOCK_RENDERING=true
MOCK_STRIPE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JS_URL=https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm
OPENAI_ENDPOINT=https://your-api-domain.com/openai-copy
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_xxx
STRIPE_CHECKOUT_ENDPOINT=https://your-api-domain.com/create-checkout-session
RENDER_WORKER_URL=https://your-render-worker.com
RENDER_WEBHOOK_SECRET=replace-me
```

8. Deploy, then verify:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/demo
https://YOUR-VERCEL-DOMAIN.vercel.app/app
```

9. For local production-mode auth testing, edit `env.js` or use query params:

```text
http://localhost:4173/app/?MOCK_SUPABASE=false
```

Use real Supabase values in `env.js` for local auth testing. Do not commit production secrets.

## Future Expo and Remotion Setup

The current `package.json` is static-only so Vercel does not install conflicting Expo, React Native, or Remotion packages. The code folders remain in the repo for future work:

- `src/`
- `App.tsx`
- `remotion/`
- `backend/rendering/`

See `docs/FUTURE_NATIVE_RENDERING_DEPS.md` for the dependency lists to re-enable later in a separate Expo app or render worker.

For the static MVP, install/check with:

```bash
npm install
npm run build
```

When the native app stack is split back out, restore the Expo scripts and run:

```bash
npm run start
npm run web
npm run typecheck
npm run render:mock
npm run render:remotion
```

Copy environment variables:

```bash
cp .env.example .env
```

Then fill in:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `RENDER_WEBHOOK_SECRET`
- `MOCK_AI`
- `MOCK_RENDERING`
- `MOCK_STRIPE`
- `MOCK_SUPABASE`
- `RENDER_ENDPOINT`

## Feature Flags

For the local browser MVP, edit `env.js`:

```js
window.ESTATEMOTION_ENV = {
  MOCK_AI: true,
  MOCK_RENDERING: true,
  MOCK_STRIPE: true,
  MOCK_SUPABASE: true,
  RENDER_ENDPOINT: ""
};
```

You can also override flags with query parameters:

```text
http://localhost:4173?MOCK_RENDERING=false&RENDER_ENDPOINT=http://localhost:8787/render
```

Or with localStorage keys like `ESTATEMOTION_MOCK_RENDERING`.

## Connecting OpenAI

1. Keep `MOCK_AI=true` for local deterministic copy.
2. Create a secure backend endpoint that holds `OPENAI_API_KEY`.
3. Send project, template, local market, and brand kit fields to that endpoint.
4. Return hook, property description, highlights, caption, hashtags, and voiceover.
5. Replace `aiCopy()` in `app.js` or `requestOpenAICopy()` in `src/lib/ai.ts` with the endpoint response.

Never expose a production OpenAI API key in the browser.

## Connecting Supabase

1. Run `supabase/schema.sql` and `supabase/seed.sql`.
2. Create storage buckets for `project-photos`, `brand-assets`, and `generated-videos`.
3. Add RLS policies per user/project ownership.
4. Set `MOCK_SUPABASE=false`.
5. Replace localStorage reads/writes with Supabase table and storage calls.

## Connecting Stripe

1. Create products for Pay-per-export, Monthly Pro, and Brokerage plan.
2. Add Checkout session and customer portal endpoints.
3. Add Stripe webhooks to update `subscriptions`, `users.credit_balance`, and `exports`.
4. Set `MOCK_STRIPE=false`.

## Enabling Real Rendering

Local MVP export stays stable with `MOCK_RENDERING=true`.

To enable real MP4 rendering:

1. Start the separate Remotion worker:

```bash
cd render-worker
npm install
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
SUPABASE_GENERATED_VIDEOS_BUCKET=generated-videos \
RENDER_WORKER_SECRET=replace-me \
npm run start
```

2. Set these Vercel env vars on the static app:

```text
MOCK_RENDERING=false
RENDER_WORKER_URL=https://your-render-worker.example.com
RENDER_WEBHOOK_SECRET=replace-me
```

3. The browser app posts the EstateMotion render manifest to `/api/render`.
4. `/api/render` forwards the manifest to the worker.
5. The worker renders a true MP4 and thumbnail with Remotion, uploads both to the Supabase `generated-videos` bucket, and returns the downloadable MP4 URL.

Live rendering requires Supabase/public image URLs. Browser `blob:` URLs from fully local mock uploads cannot be rendered by a remote worker, so keep `MOCK_RENDERING=true` for pure local demos.

## Supabase Setup

Create tables and seed templates:

```bash
psql "$SUPABASE_DB_URL" -f supabase/schema.sql
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Tables included:

- `users`
- `brand_kits`
- `projects`
- `project_photos`
- `generated_videos`
- `templates`
- `subscriptions`
- `exports`

## Rendering Pipeline

The MVP uses deterministic rendering instead of true generative video:

1. Fetch ordered project photos.
2. Select scenes by content-pack type.
3. Apply Ken Burns pan/zoom motion.
4. Add template-specific transitions.
5. Add intro, hook, price, feature highlights, captions, and CTA.
6. Add personal brand end card.
7. Add optional brokerage compliance footer.
8. Export MP4, thumbnail PNG, caption TXT, and hashtag TXT.

Current local export is JSON plus standalone preview HTML when `MOCK_RENDERING=true`. Live MP4 export is handled by:

- `api/render.js`
- `render-worker/server.mjs`
- `render-worker/src/render-job.mjs`
- `render-worker/src/EstateMotionRender.jsx`

Backend starter files still retained for the future native/backend stack:

- `backend/rendering/ffmpegRenderer.ts`
- `backend/rendering/remotionPipeline.ts`
- `backend/rendering/mockRenderJob.ts`
- `backend/rendering/renderContentPack.ts`
- `remotion/reel.tsx`

## Known Limitations

- MP4 generation requires the separate Remotion worker and Supabase/public photo URLs. It is mocked in the browser fallback.
- OpenAI copy generation is deterministic local logic until a secure backend endpoint is connected.
- Supabase and Stripe are scaffolded but not live in the local MVP.
- Native image picking needs Expo ImagePicker integration for iOS/Android; web upload works.
- Browser local storage can be too small for many large uploaded photos.
- RLS policies still need production hardening.
- No lint script is configured yet.

## This Environment

In this Codex desktop environment, `node` is available but `npm` is not on the shell path, so `npm install`, Expo launch, and TypeScript typecheck could not be executed here. The local browser MVP was run and validated at `http://localhost:4173`.

## Future AI Video API TODO

- Add optional AI motion generation behind Authenticity Mode.
- Keep real listing photos as the default source of truth.
- Add a render-worker queue for Remotion Lambda, Cloud Run, or FFmpeg.
- Store generated MP4s and thumbnails in Supabase Storage.
- Add music library licensing and per-template audio selections.
- Add share-sheet flows for Instagram, TikTok, YouTube Shorts, and Stories.
