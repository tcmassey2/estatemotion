-- EstateMotion subscription / tier schema
--
-- Run this AFTER the base supabase/schema.sql and supabase/seed.sql.
-- Apply via Supabase Dashboard → SQL Editor, or `supabase db push` if you're
-- using the Supabase CLI locally.

-- ============================================================
-- Profiles: one row per auth.users, holds tier + Stripe linkage
-- ============================================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  brokerage text,

  -- Subscription / tier
  tier text not null default 'trial'
    check (tier in ('trial', 'quick_reel', 'cinematic_ai', 'cinematic_4k')),
  monthly_video_quota integer not null default 1,
  videos_used_this_month integer not null default 0,
  billing_cycle_start timestamptz not null default now(),

  -- Stripe linkage
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text
    check (subscription_status in ('trialing','active','past_due','canceled','incomplete','unpaid')),
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,

  -- Branding
  agent_photo_url text,
  agent_phone text,
  brand_color text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.touch_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_profiles on public.profiles;
create trigger trg_touch_profiles
  before update on public.profiles
  for each row execute procedure public.touch_profiles_updated_at();

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, email, tier, monthly_video_quota, subscription_status, billing_cycle_start)
  values (new.id, new.email, 'trial', 1, 'trialing', now())
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- RLS: users can read/update their own profile, only service role
-- can change tier/quota fields.
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    -- Block users from editing tier/quota/Stripe fields directly. Service role bypasses RLS.
    and tier = (select tier from public.profiles where user_id = auth.uid())
    and monthly_video_quota = (select monthly_video_quota from public.profiles where user_id = auth.uid())
    and stripe_customer_id is not distinct from (select stripe_customer_id from public.profiles where user_id = auth.uid())
    and stripe_subscription_id is not distinct from (select stripe_subscription_id from public.profiles where user_id = auth.uid())
  );

-- ============================================================
-- Tier definitions (read-only reference table)
-- ============================================================
create table if not exists public.tier_plans (
  tier text primary key,
  display_name text not null,
  monthly_video_quota integer not null,
  available_engines text[] not null,
  max_resolution text not null,
  price_cents integer not null,
  stripe_price_id text,
  features jsonb default '[]'::jsonb,
  sort_order integer default 0
);

insert into public.tier_plans (tier, display_name, monthly_video_quota, available_engines, max_resolution, price_cents, sort_order, features) values
  ('trial',         'Free Trial',         1,  array['remotion'],            '1080p', 0,     0, '["1 sample video","Watermarked","Quick Reel only"]'::jsonb),
  ('quick_reel',    'Quick Reel',         10, array['remotion'],            '1080p', 7900,  1, '["10 videos / month","Cinematic photo motion","HD 1080p","Branded outro","9:16 vertical"]'::jsonb),
  ('cinematic_ai',  'Cinematic AI',       25, array['remotion','runway'],   '1080p', 14900, 2, '["25 videos / month","True AI image-to-video","HD 1080p","Priority queue","Priority support"]'::jsonb),
  ('cinematic_4k',  'Cinematic AI 4K',    60, array['remotion','runway'],   '4k',    29900, 3, '["60 videos / month","True AI image-to-video","4K Ultra HD","White-label / custom branding","Concierge onboarding"]'::jsonb)
on conflict (tier) do update set
  display_name = excluded.display_name,
  monthly_video_quota = excluded.monthly_video_quota,
  available_engines = excluded.available_engines,
  max_resolution = excluded.max_resolution,
  price_cents = excluded.price_cents,
  features = excluded.features,
  sort_order = excluded.sort_order;

alter table public.tier_plans enable row level security;
drop policy if exists "tier_plans_public_read" on public.tier_plans;
create policy "tier_plans_public_read" on public.tier_plans
  for select using (true);

-- ============================================================
-- Render usage tracking
-- ============================================================
create table if not exists public.render_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text not null,
  engine text not null check (engine in ('remotion','runway')),
  status text not null default 'queued',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  mp4_url text,
  thumbnail_url text,
  error_message text,
  cost_cents integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_render_usage_user_started on public.render_usage(user_id, started_at desc);

alter table public.render_usage enable row level security;
drop policy if exists "render_usage_self_select" on public.render_usage;
create policy "render_usage_self_select" on public.render_usage
  for select using (auth.uid() = user_id);

-- ============================================================
-- Helper RPC: get_user_tier_state
-- Returns current tier, quota, used count, and whether they can render.
-- Use this from /api/render before submitting a job.
-- ============================================================
create or replace function public.get_user_tier_state(p_user_id uuid)
returns table (
  tier text,
  monthly_video_quota integer,
  videos_used_this_month integer,
  available_engines text[],
  can_render boolean,
  reason text
)
language sql security definer as $$
  select
    p.tier,
    p.monthly_video_quota,
    p.videos_used_this_month,
    tp.available_engines,
    (p.videos_used_this_month < p.monthly_video_quota
      and (p.subscription_status in ('trialing','active') or p.tier = 'trial')) as can_render,
    case
      when p.subscription_status = 'past_due' then 'Subscription past due — update payment to continue rendering.'
      when p.subscription_status = 'canceled' then 'Subscription canceled.'
      when p.videos_used_this_month >= p.monthly_video_quota then 'Monthly video quota reached. Upgrade or wait until next billing cycle.'
      else null
    end as reason
  from public.profiles p
  left join public.tier_plans tp on tp.tier = p.tier
  where p.user_id = p_user_id;
$$;
