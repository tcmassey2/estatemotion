-- EstateMotion — Email dedupe column
--
-- The trial-reminder cron (api/cron/trial-reminders.js) uses this column
-- to track which bucket (trial-3d, trial-1d, trial-expired) was last sent
-- to each user, so a given email is delivered exactly once per bucket.
--
-- Apply via Supabase Dashboard → SQL Editor.
-- Safe to run multiple times.

alter table public.profiles
  add column if not exists last_reminder_sent text;

comment on column public.profiles.last_reminder_sent is
  'Identifier of the most recent transactional reminder sent to this user (e.g. trial-3d, trial-1d, trial-expired). Cron jobs check this to dedupe.';
