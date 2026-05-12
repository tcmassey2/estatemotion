-- EstateMotion — Brand kit app-specific fields
--
-- The original brand_kits table (schema.sql) was designed before we added
-- license display, voice cloning, and full-name capture in the React app.
-- Adding the missing columns here so the agent's brand kit can persist to
-- Supabase end-to-end (instead of just localStorage as it was through v17).
--
-- Apply via Supabase Dashboard → SQL Editor.
-- Safe to run multiple times (IF NOT EXISTS).

alter table public.brand_kits
  add column if not exists full_name text,
  add column if not exists license_number text,
  add column if not exists voice_id text,
  add column if not exists voice_label text;

-- Make `name` nullable / default empty — it was required in the original
-- schema but the React app doesn't capture it (we have full_name + brokerage
-- as the canonical labels). Keeping the column to avoid breaking older code.
alter table public.brand_kits
  alter column name drop not null,
  alter column name set default '';

comment on column public.brand_kits.full_name is 'Agent display name on the outro card. Maps to AgentBranding.fullName in the React app.';
comment on column public.brand_kits.license_number is 'State real-estate license # shown on the outro card for MLS compliance.';
comment on column public.brand_kits.voice_id is 'ElevenLabs voice clone ID. When set, narration uses the agent''s cloned voice.';
comment on column public.brand_kits.voice_label is 'Display label for the cloned voice (typically the agent''s first name).';
