-- EstateMotion live schema hardening
-- Safe to run against production. It only adds missing columns/indexes/policies
-- and preserves existing beta data.

create extension if not exists "uuid-ossp";

-- USERS: required by syncUserProfile() in supabaseClient.js.
alter table public.users add column if not exists email text;
alter table public.users add column if not exists full_name text;
alter table public.users add column if not exists subscription_status text not null default 'free';
alter table public.users add column if not exists credit_balance integer not null default 0;
alter table public.users add column if not exists created_at timestamptz not null default now();

-- PROJECTS: required by mapProjectToRow()/mapProjectFromRow().
alter table public.projects add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.projects add column if not exists brand_kit_id uuid references public.brand_kits(id);
alter table public.projects add column if not exists template_id text;
alter table public.projects add column if not exists title text;
alter table public.projects add column if not exists property_address text;
alter table public.projects add column if not exists price text;
alter table public.projects add column if not exists beds numeric;
alter table public.projects add column if not exists baths numeric;
alter table public.projects add column if not exists square_feet integer;
alter table public.projects add column if not exists neighborhood text;
alter table public.projects add column if not exists city text;
alter table public.projects add column if not exists listing_type text not null default 'Just Listed';
alter table public.projects add column if not exists hook_text text;
alter table public.projects add column if not exists caption text;
alter table public.projects add column if not exists cta text;
alter table public.projects add column if not exists hook_preset text;
alter table public.projects add column if not exists caption_tone text;
alter table public.projects add column if not exists reel_theme text;
alter table public.projects add column if not exists text_animation text;
alter table public.projects add column if not exists music_mood text;
alter table public.projects add column if not exists outro_variation text;
alter table public.projects add column if not exists thumbnail_preset text;
alter table public.projects add column if not exists reel_variations jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists branding_visible boolean not null default true;
alter table public.projects add column if not exists authenticity_mode boolean not null default true;
alter table public.projects add column if not exists local_agent_mode boolean not null default true;
alter table public.projects add column if not exists intro_text text;
alter table public.projects add column if not exists outro_text text;
alter table public.projects add column if not exists content_mode text not null default 'listing-reel';
alter table public.projects add column if not exists conversion_goal text;
alter table public.projects add column if not exists cta_url text;
alter table public.projects add column if not exists qr_code_url text;
alter table public.projects add column if not exists seller_presentation_mode boolean not null default false;
alter table public.projects add column if not exists investor_metrics jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists reel_plan_edits jsonb;
alter table public.projects add column if not exists status text not null default 'draft';
alter table public.projects add column if not exists created_at timestamptz not null default now();

-- PROJECT_PHOTOS: required by mapPhotoToRow()/mapPhotoFromRow().
alter table public.project_photos add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.project_photos add column if not exists client_id text;
alter table public.project_photos add column if not exists storage_path text;
alter table public.project_photos add column if not exists public_url text;
alter table public.project_photos add column if not exists file_name text;
alter table public.project_photos add column if not exists category text not null default 'Detail shots';
alter table public.project_photos add column if not exists sort_order integer not null default 0;
alter table public.project_photos add column if not exists file_size integer;
alter table public.project_photos add column if not exists width integer;
alter table public.project_photos add column if not exists height integer;
alter table public.project_photos add column if not exists render_metadata jsonb not null default '{}'::jsonb;
alter table public.project_photos add column if not exists created_at timestamptz not null default now();

-- BETA_FEEDBACK: required by saveBetaFeedback().
create table if not exists public.beta_feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  project_title text,
  rating integer,
  usable_enough text,
  feedback_text text,
  render_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.beta_feedback add column if not exists user_id uuid references public.users(id) on delete set null;
alter table public.beta_feedback add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.beta_feedback add column if not exists project_title text;
alter table public.beta_feedback add column if not exists rating integer;
alter table public.beta_feedback add column if not exists usable_enough text;
alter table public.beta_feedback add column if not exists feedback_text text;
alter table public.beta_feedback add column if not exists render_metadata jsonb not null default '{}'::jsonb;
alter table public.beta_feedback add column if not exists created_at timestamptz not null default now();

-- Required upsert target for project_photos.
create unique index if not exists project_photos_project_client_unique
  on public.project_photos(project_id, client_id);

-- Preserve and enforce RLS posture.
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_photos enable row level security;
alter table public.beta_feedback enable row level security;

drop policy if exists "Users manage own beta feedback" on public.beta_feedback;
create policy "Users manage own beta feedback" on public.beta_feedback
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'Users can read own profile'
  ) then
    create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'Users can upsert own profile'
  ) then
    create policy "Users can upsert own profile" on public.users for insert with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects' and policyname = 'Users manage own projects'
  ) then
    create policy "Users manage own projects" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'project_photos' and policyname = 'Users manage photos for own projects'
  ) then
    create policy "Users manage photos for own projects" on public.project_photos
      for all using (
        exists (
          select 1 from public.projects
          where projects.id = project_photos.project_id
          and projects.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.projects
          where projects.id = project_photos.project_id
          and projects.user_id = auth.uid()
        )
      );
  end if;

end $$;
