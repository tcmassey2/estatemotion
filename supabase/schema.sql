create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  subscription_status text not null default 'free',
  credit_balance integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.brand_kits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  brokerage text,
  headshot_path text,
  logo_path text,
  headshot_url text,
  logo_url text,
  phone text,
  email text,
  website text,
  instagram_handle text,
  primary_color text not null default '#111111',
  accent_color text not null default '#C7A76C',
  cta_text text not null default 'Book a private tour',
  compliance_enabled boolean not null default true,
  listing_courtesy_of text,
  brokerage_disclaimer text,
  equal_housing boolean not null default true,
  mls_disclaimer text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  brand_kit_id uuid references public.brand_kits(id),
  template_id text,
  title text,
  property_address text not null,
  price text,
  beds numeric,
  baths numeric,
  square_feet integer,
  neighborhood text,
  city text,
  listing_type text not null,
  hook_text text,
  caption text,
  cta text,
  hook_preset text,
  caption_tone text,
  reel_theme text,
  text_animation text,
  music_mood text,
  outro_variation text,
  thumbnail_preset text,
  reel_variations jsonb not null default '[]'::jsonb,
  branding_visible boolean not null default true,
  authenticity_mode boolean not null default true,
  local_agent_mode boolean not null default true,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.project_photos (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id text not null,
  storage_path text not null,
  public_url text,
  file_name text not null,
  category text not null default 'Detail shots',
  sort_order integer not null default 0,
  file_size integer,
  width integer,
  height integer,
  render_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(project_id, client_id)
);

alter table public.project_photos add column if not exists render_metadata jsonb not null default '{}'::jsonb;
alter table public.project_photos add column if not exists width integer;
alter table public.project_photos add column if not exists height integer;

create table if not exists public.templates (
  id text primary key,
  name text not null,
  description text,
  font_style text,
  text_placement text,
  motion_speed text,
  transition_style text,
  intro_layout text,
  outro_layout text,
  cta_wording text,
  accent_color text
);

create table if not exists public.generated_videos (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id text,
  template_id text references public.templates(id),
  format text not null,
  content_pack_type text not null,
  status text not null default 'queued',
  output_path text,
  thumbnail_path text,
  caption_text text,
  hashtags text[],
  render_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(project_id, client_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_name text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.exports (
  id uuid primary key default uuid_generate_v4(),
  generated_video_id uuid not null references public.generated_videos(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  export_type text not null,
  storage_path text,
  downloaded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.beta_feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  project_title text,
  rating integer not null check (rating between 1 and 5),
  usable_enough text not null,
  feedback_text text,
  render_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.brand_kits enable row level security;
alter table public.projects enable row level security;
alter table public.project_photos enable row level security;
alter table public.generated_videos enable row level security;
alter table public.subscriptions enable row level security;
alter table public.exports enable row level security;
alter table public.beta_feedback enable row level security;

drop policy if exists "Users can read own profile" on public.users;
drop policy if exists "Users can upsert own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users manage own brand kits" on public.brand_kits;
drop policy if exists "Users manage own projects" on public.projects;
drop policy if exists "Users manage photos for own projects" on public.project_photos;
drop policy if exists "Users manage videos for own projects" on public.generated_videos;
drop policy if exists "Users read own subscriptions" on public.subscriptions;
drop policy if exists "Users manage own exports" on public.exports;
drop policy if exists "Users manage own beta feedback" on public.beta_feedback;
drop policy if exists "Users upload project photos" on storage.objects;
drop policy if exists "Users update project photos" on storage.objects;
drop policy if exists "Users read project photos" on storage.objects;
drop policy if exists "Users upload listing photos" on storage.objects;
drop policy if exists "Users update listing photos" on storage.objects;
drop policy if exists "Users read listing photos" on storage.objects;
drop policy if exists "Users upload brand assets" on storage.objects;
drop policy if exists "Users update brand assets" on storage.objects;
drop policy if exists "Users read brand assets" on storage.objects;
drop policy if exists "Users upload generated videos" on storage.objects;
drop policy if exists "Users update generated videos" on storage.objects;
drop policy if exists "Users read generated videos" on storage.objects;

create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can upsert own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

create policy "Users manage own brand kits" on public.brand_kits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own projects" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

create policy "Users manage videos for own projects" on public.generated_videos
  for all using (
    exists (
      select 1 from public.projects
      where projects.id = generated_videos.project_id
      and projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = generated_videos.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users read own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users manage own exports" on public.exports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own beta feedback" on public.beta_feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values
  ('listing-photos', 'listing-photos', true),
  ('project-photos', 'project-photos', true),
  ('brand-assets', 'brand-assets', true),
  ('generated-videos', 'generated-videos', true)
on conflict (id) do update set public = excluded.public;

create policy "Users upload project photos" on storage.objects
  for insert with check (bucket_id = 'project-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users update project photos" on storage.objects
  for update using (bucket_id = 'project-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users read project photos" on storage.objects
  for select using (bucket_id = 'project-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users upload listing photos" on storage.objects
  for insert with check (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users update listing photos" on storage.objects
  for update using (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users read listing photos" on storage.objects
  for select using (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users upload brand assets" on storage.objects
  for insert with check (bucket_id = 'brand-assets' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users update brand assets" on storage.objects
  for update using (bucket_id = 'brand-assets' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users read brand assets" on storage.objects
  for select using (bucket_id = 'brand-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users upload generated videos" on storage.objects
  for insert with check (bucket_id = 'generated-videos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users update generated videos" on storage.objects
  for update using (bucket_id = 'generated-videos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users read generated videos" on storage.objects
  for select using (bucket_id = 'generated-videos' and auth.uid()::text = (storage.foldername(name))[1]);
