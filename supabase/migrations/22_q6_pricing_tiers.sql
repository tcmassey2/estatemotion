-- 22_q6_pricing_tiers.sql
-- ============================================================
-- q6 launch pricing lineup (v26.11). Replaces the old $99/$249/$499
-- subscription tiers and the interim pay-per-video-only messaging with:
--
--   Trial   — first video free (no card)
--   Pro     — $49/mo  (or annual), 5 videos / cycle
--   Studio  — $99/mo  (or annual), 10 videos / cycle
--   One-off — $39 / video (pay-per-video, no subscription)
--
-- Video QUOTAS are written onto profiles by the Stripe webhook
-- (QUOTA_FOR_TIER in api/stripe-webhook.js: pro=5, studio=10). DOLLAR
-- PRICES live on the Stripe products' default_price and are resolved at
-- checkout — so this migration only governs ENGINE ENTITLEMENTS and
-- reconciles any existing profiles.
--
-- It also closes the audit gap where tier_plans.available_engines listed
-- 'runway' but not 'veo' (the production engine). api/render.js already
-- treats veo/runway as interchangeable, but listing 'veo' explicitly makes
-- the entitlement correct at the source and unblocks the regen path too.
-- ============================================================

begin;

-- 1. Every paid tier (current + legacy) explicitly grants the real engine
--    set, including 'veo'. Idempotent.
update public.tier_plans
  set available_engines = array['remotion', 'runway', 'veo', 'depth']
  where tier in ('pro', 'studio', 'trial', 'launch', 'cinematic_ai', 'cinematic_4k');

-- Ensure the q6 tier rows exist even on a DB that skipped migration 13.
-- display_name is NOT NULL, so it must be supplied on insert; on conflict we
-- only touch available_engines so any existing label/price columns are left as-is.
-- price_cents documents the monthly price in the DB (Stripe remains the source
-- of truth at checkout): Pro $49 = 4900, Studio $99 = 9900. stripe_price_id and
-- features are nullable / defaulted, so they're left for Stripe wiring.
insert into public.tier_plans (tier, display_name, monthly_video_quota, max_resolution, price_cents, available_engines)
values
  ('pro',    'Pro',    5,  '1080p', 4900, array['remotion', 'runway', 'veo', 'depth']),
  ('studio', 'Studio', 10, '1080p', 9900, array['remotion', 'runway', 'veo', 'depth'])
on conflict (tier) do update
  set available_engines   = excluded.available_engines,
      monthly_video_quota = excluded.monthly_video_quota,
      price_cents         = excluded.price_cents;

-- 2. Reconcile any existing subscribers' monthly quota to the q6 numbers
--    (pre-launch this is a no-op or near-no-op; safe to run).
update public.profiles set monthly_video_quota = 5  where tier = 'pro';
update public.profiles set monthly_video_quota = 10 where tier = 'studio';

commit;
