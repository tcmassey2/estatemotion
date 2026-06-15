-- 14_render_credit_packs.sql
-- v26.6: one-off video purchases + credit packs (no subscription).
--   Single video  $100 → 1 credit
--   5-video pack   $375 → 5 credits
-- Credits never expire and are consumed AFTER subscription quota.
-- A 60-second video consumes 2 credits (matches render.js renderCreditsFor).
--
-- This is the cash-flywheel path: cold ad traffic gets 1 free trial video,
-- then buys credit packs. Collected cash (not MRR) funds more ad spend.

-- 1. Purchased-credit balance. Separate from monthly_video_quota so it
--    survives billing-cycle resets and works for users with no subscription.
alter table public.profiles
  add column if not exists render_credits integer not null default 0;

-- 2. Grant credits (called from the Stripe webhook on a paid one-time
--    checkout). Idempotent per Stripe session id via the ledger table so a
--    webhook retry can't double-grant.
create table if not exists public.credit_grants (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  credits integer not null,
  granted_at timestamptz not null default now()
);
alter table public.credit_grants enable row level security;
drop policy if exists "credit_grants_select_own" on public.credit_grants;
create policy "credit_grants_select_own"
  on public.credit_grants for select using (auth.uid() = user_id);

create or replace function public.grant_render_credits(
  p_user_id uuid,
  p_credits integer,
  p_session_id text
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_inserted boolean;
begin
  insert into public.credit_grants (stripe_session_id, user_id, credits)
  values (p_session_id, p_user_id, p_credits)
  on conflict (stripe_session_id) do nothing;
  get diagnostics v_inserted = row_count;
  if not v_inserted then return false; end if; -- already granted

  update public.profiles
  set render_credits = coalesce(render_credits, 0) + greatest(p_credits, 0)
  where user_id = p_user_id;
  return true;
end;
$$;
revoke all on function public.grant_render_credits(uuid, integer, text) from public, anon, authenticated;

-- 3. Redefine the tier-state gate to allow rendering when the user has
--    purchased credits, even with no active subscription / exhausted trial.
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
  subscription_status text,
  render_credits integer
)
language sql security definer as $$
  with constants as (select 1::integer as trial_render_cap)
  select
    p.tier,
    p.monthly_video_quota,
    p.videos_used_this_month,
    tp.available_engines,
    (
      coalesce(p.render_credits, 0) >= 1
      or (
        p.videos_used_this_month < p.monthly_video_quota
        and (p.subscription_status in ('trialing','active') or p.tier = 'trial')
        and not (p.tier = 'trial' and p.trial_ends_at is not null and now() > p.trial_ends_at)
        and not (p.tier = 'trial' and p.trial_renders_used >= c.trial_render_cap)
      )
    ) as can_render,
    case
      when coalesce(p.render_credits,0) >= 1 then null
      when p.subscription_status = 'past_due' then 'Subscription past due — update payment to continue rendering.'
      when p.subscription_status = 'canceled' then 'Subscription canceled.'
      when p.tier = 'trial' and p.trial_ends_at is not null and now() > p.trial_ends_at then
        'Your free trial has ended. Buy a video or pick a plan to keep rendering.'
      when p.tier = 'trial' and p.trial_renders_used >= c.trial_render_cap then
        'You''ve used your free trial video. Buy a video ($100) or pick a plan to keep rendering.'
      when p.videos_used_this_month >= p.monthly_video_quota then
        'Monthly video quota reached. Buy a video, upgrade, or wait until next cycle.'
      else null
    end as reason,
    p.trial_ends_at,
    p.trial_renders_used,
    c.trial_render_cap,
    p.current_period_end,
    p.subscription_status,
    coalesce(p.render_credits, 0) as render_credits
  from public.profiles p
  left join public.tier_plans tp on tp.tier = p.tier
  cross join constants c
  where p.user_id = p_user_id;
$$;

-- 4. Consumption: prefer subscription quota; fall back to purchased credits.
--    p_credits = 1 (30s) or 2 (60s). Replaces the v26.5 increment_render_usage.
create or replace function public.increment_render_usage(
  p_user_id uuid,
  p_credits integer default 1
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_used integer; v_quota integer; v_status text; v_tier text; v_credits integer;
  v_n integer := greatest(p_credits, 1);
begin
  select videos_used_this_month, monthly_video_quota, subscription_status, tier, coalesce(render_credits,0)
    into v_used, v_quota, v_status, v_tier, v_credits
  from public.profiles where user_id = p_user_id for update;
  if not found then return; end if;

  if v_used < v_quota and (v_status in ('trialing','active') or v_tier = 'trial') then
    -- Covered by subscription / trial quota.
    update public.profiles
    set videos_used_this_month = coalesce(videos_used_this_month,0) + v_n,
        trial_renders_used = case when tier='trial'
          then coalesce(trial_renders_used,0) + v_n else trial_renders_used end
    where user_id = p_user_id;
  else
    -- Consume purchased credits (floor 0).
    update public.profiles
    set render_credits = greatest(coalesce(render_credits,0) - v_n, 0)
    where user_id = p_user_id;
  end if;
end;
$$;
revoke all on function public.increment_render_usage(uuid, integer) from public, anon, authenticated;
