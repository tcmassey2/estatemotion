-- EstateMotion — Trial enforcement
--
-- Pre-this-migration, "trial" was a label only: users got a permanent
-- 1-video/month quota with no expiry, and the marketing copy ("7-day free
-- trial") was a lie. This migration makes the trial real.
--
-- Trial gate: 7 DAYS or 3 RENDERS, whichever comes first.
--
-- Apply via Supabase Dashboard → SQL Editor.
-- Safe to run multiple times.

-- ============================================================
-- 1. New columns on profiles
-- ============================================================
alter table public.profiles
  add column if not exists trial_started_at timestamptz default now(),
  add column if not exists trial_ends_at timestamptz,
  add column if not exists trial_renders_used integer not null default 0;

-- Backfill trial_ends_at for any existing trial users so they're not
-- locked out immediately. Pre-migration users get a fresh 7-day window
-- starting NOW (not from their original signup) — they were on infinite
-- trial before, this is the kindest migration.
update public.profiles
  set trial_ends_at = now() + interval '7 days'
  where tier = 'trial' and trial_ends_at is null;

-- New signups: trial_ends_at = signup + 7 days.
-- The original handle_new_user() didn't touch this column — update it.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (
    user_id,
    email,
    tier,
    monthly_video_quota,
    subscription_status,
    billing_cycle_start,
    trial_started_at,
    trial_ends_at,
    trial_renders_used
  )
  values (
    new.id,
    new.email,
    'trial',
    1,
    'trialing',
    now(),
    now(),
    now() + interval '7 days',
    0
  )
  on conflict (user_id) do nothing;
  return new;
end $$;

-- ============================================================
-- 2. Update get_user_tier_state to enforce the trial gate
-- ============================================================
-- Returns three new fields the UI uses for the countdown banner:
--   trial_ends_at         (when the time-based trial expires)
--   trial_renders_used    (how many renders the trial user has burned)
--   trial_render_cap      (the max — currently hardcoded to 3)
-- can_render flips false when EITHER:
--   - tier = 'trial' AND now() > trial_ends_at, OR
--   - tier = 'trial' AND trial_renders_used >= trial_render_cap, OR
--   - any of the existing checks (quota / past_due / canceled)
--
-- DROP FIRST: this migration changes the RETURN TABLE shape of an
-- existing function (adds 5 new columns). Postgres won't let you do that
-- with CREATE OR REPLACE alone — error: "cannot change return type of
-- existing function". Drop explicitly so the new shape can be created.
drop function if exists public.get_user_tier_state(uuid);

create or replace function public.get_user_tier_state(p_user_id uuid)
returns table (
  tier text,
  monthly_video_quota integer,
  videos_used_this_month integer,
  available_engines text[],
  can_render boolean,
  reason text,
  trial_ends_at timestamptz,
  trial_renders_used integer,
  trial_render_cap integer,
  current_period_end timestamptz,
  subscription_status text
)
language sql security definer as $$
  with constants as (
    select 3::integer as trial_render_cap
  )
  select
    p.tier,
    p.monthly_video_quota,
    p.videos_used_this_month,
    tp.available_engines,
    (
      -- Standard quota / sub status checks
      p.videos_used_this_month < p.monthly_video_quota
      and (p.subscription_status in ('trialing','active') or p.tier = 'trial')
      -- Trial-specific gates
      and not (p.tier = 'trial' and p.trial_ends_at is not null and now() > p.trial_ends_at)
      and not (p.tier = 'trial' and p.trial_renders_used >= c.trial_render_cap)
    ) as can_render,
    case
      when p.subscription_status = 'past_due' then 'Subscription past due — update payment to continue rendering.'
      when p.subscription_status = 'canceled' then 'Subscription canceled.'
      when p.tier = 'trial' and p.trial_ends_at is not null and now() > p.trial_ends_at then
        'Your 7-day free trial has ended. Pick a plan to keep rendering.'
      when p.tier = 'trial' and p.trial_renders_used >= c.trial_render_cap then
        'You''ve used all ' || c.trial_render_cap || ' free trial videos. Pick a plan to keep rendering.'
      when p.videos_used_this_month >= p.monthly_video_quota then
        'Monthly video quota reached. Upgrade or wait until next billing cycle.'
      else null
    end as reason,
    p.trial_ends_at,
    p.trial_renders_used,
    c.trial_render_cap,
    p.current_period_end,
    p.subscription_status
  from public.profiles p
  left join public.tier_plans tp on tp.tier = p.tier
  cross join constants c
  where p.user_id = p_user_id;
$$;

-- ============================================================
-- 3. RPC the render endpoint calls after a successful submit
--    to bump the trial counter. No-op if the user isn't on trial.
-- ============================================================
create or replace function public.increment_trial_render(p_user_id uuid)
returns void
language sql security definer as $$
  update public.profiles
    set trial_renders_used = trial_renders_used + 1
    where user_id = p_user_id and tier = 'trial';
$$;

-- ============================================================
-- 4. RPC the Stripe webhook calls when a trial user upgrades.
--    Resets the counter (now they have a paid quota, the trial fields
--    no longer matter but we clear them for cleanliness).
-- ============================================================
create or replace function public.clear_trial_state(p_user_id uuid)
returns void
language sql security definer as $$
  update public.profiles
    set trial_renders_used = 0,
        trial_ends_at = null
    where user_id = p_user_id;
$$;
