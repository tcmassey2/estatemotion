# EstateMotion Deploy Checklist

Use this for the first production deployment. Keep `MOCK_*` flags on until each connected service is verified.

## 1. Supabase Setup

1. Create a new Supabase project.
2. Open Supabase SQL Editor.
3. Paste and run the contents of `supabase/schema.sql`.
4. Paste and run the contents of `supabase/seed.sql`.
5. Confirm these tables exist:
   - `users`
   - `brand_kits`
   - `projects`
   - `project_photos`
   - `generated_videos`
   - `templates`
   - `subscriptions`
   - `exports`
6. Confirm these Storage buckets exist:
   - `project-photos`
   - `brand-assets`
   - `generated-videos`
7. In Authentication > Providers, enable Email.
8. In Authentication > Providers, enable Google and add the Google OAuth client credentials.
9. In Authentication > URL Configuration, add redirect URLs:

```text
http://localhost:4173/app/
https://YOUR-VERCEL-DOMAIN.vercel.app/app/
```

10. Copy the Supabase Project URL and anon public key.

## 2. Vercel Setup

1. Import this repo into Vercel.
2. Keep the browser MVP as a static app. No build command is required for the static deployment.
3. Confirm `vercel.json` is present and includes rewrites for:
   - `/app`
   - `/demo`
4. Add the production environment variables below.
5. Deploy.
6. Open the deployment URL and verify:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/demo
https://YOUR-VERCEL-DOMAIN.vercel.app/app
```

## 3. Environment Variables

Required for production Supabase mode:

```text
MOCK_SUPABASE=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JS_URL=https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm
```

Safe to keep mocked for first deploy:

```text
MOCK_AI=true
MOCK_RENDERING=true
MOCK_STRIPE=true
OPENAI_ENDPOINT=
RENDER_ENDPOINT=
STRIPE_PUBLISHABLE_KEY=
STRIPE_CHECKOUT_ENDPOINT=
```

Switch on later when services are connected:

```text
MOCK_AI=false
MOCK_RENDERING=false
MOCK_STRIPE=false
OPENAI_ENDPOINT=https://your-api.example.com/openai-copy
RENDER_ENDPOINT=https://your-render-worker.example.com/render
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_xxx
STRIPE_CHECKOUT_ENDPOINT=https://your-api.example.com/create-checkout-session
```

## 4. Production Smoke Test

Run this after every production deploy:

1. `/demo` public
   - Open `/demo` in a private browser window.
   - Confirm the headline, pricing cards, and early access form are visible.
   - Confirm no login is required.

2. `/app` protected
   - Open `/app` in a signed-out browser.
   - Confirm the auth gate appears.
   - Confirm the topbar shows `Production Mode` when all `MOCK_*` flags are false, or `Mock Mode` while any mock flag remains true.

3. Magic link login
   - Enter a test email.
   - Click `Send magic link`.
   - Confirm the email arrives.
   - Open the magic link and confirm it redirects to `/app`.

4. Google login
   - Click `Continue with Google`.
   - Complete OAuth.
   - Confirm it redirects to `/app`.

5. Create project
   - Open `Project`.
   - Enter property address, price, city, neighborhood, and listing type.
   - Continue to photos.

6. Upload photos
   - Upload at least 3 image files.
   - Confirm they appear in the grid.
   - Confirm Supabase Storage receives objects in `project-photos`.

7. Save brand kit
   - Open brand/onboarding flow.
   - Enter agent name and brokerage.
   - Upload a headshot or logo.
   - Confirm Supabase Storage receives objects in `brand-assets`.

8. Export manifest
   - Open `Results`.
   - Queue the content pack.
   - Download the JSON manifest.
   - If `MOCK_SUPABASE=false`, confirm generated artifact metadata saves to Supabase.

## 5. Expected Local Warnings

When serving locally with `python3 -m http.server 4173`, `/api/env` is unavailable because it is a Vercel serverless function. The app should show a local fallback warning and continue using `env.js`.

This warning should not appear on Vercel unless `/api/env` fails to deploy.

## 6. Stop/Go Criteria

Ready for first production demo when:

- `/demo` is public.
- `/app` is protected.
- Email magic link works.
- Google login works.
- Project data persists after refresh.
- Photo uploads reach Supabase Storage.
- Brand assets reach Supabase Storage.
- Export manifest downloads.

Block deployment if:

- `SUPABASE_URL` or `SUPABASE_ANON_KEY` is missing while `MOCK_SUPABASE=false`.
- `/app` loads without an auth gate while signed out.
- `/demo` requires login.
- RLS prevents the signed-in user from saving their own project.
- Storage upload policies reject valid signed-in uploads.
