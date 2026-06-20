-- 21_engine_check_allow_veo_depth.sql
-- ============================================================
-- FIX: rendered videos stopped appearing in the library after the June 2026
-- Veo cutover (Phase 2).
--
-- Root cause: the render worker writes engine='veo' for Cinematic AI renders
-- (and engine='depth' for the depth engine), but render_audit_log.engine — and
-- the matching columns on render_usage and render_jobs — still carried a CHECK
-- constraint allowing only ('remotion','runway'). Every audit INSERT with
-- engine='veo' violated the constraint and FAILED. Because the audit write is
-- fire-and-forget, the video still rendered and the user got it, but no row was
-- written to render_audit_log — and api/library.js reads exactly that table
-- (agent_user_id = caller, status='completed', master_mp4_url <> ''), so the
-- library came back empty for every render after the cutover.
--
-- This widens the engine CHECK on all three tables to the real engine set:
-- remotion (Quick Reel), runway (legacy), veo (production AI), depth (2.5D).
-- The application code already emits the correct values — only the DB needed
-- to accept them. Existing rows are all 'remotion'/'runway', so the wider
-- constraint validates cleanly against current data.
-- ============================================================

begin;

alter table if exists public.render_audit_log
  drop constraint if exists render_audit_log_engine_check;
alter table if exists public.render_audit_log
  add constraint render_audit_log_engine_check
  check (engine in ('remotion', 'runway', 'veo', 'depth'));

alter table if exists public.render_usage
  drop constraint if exists render_usage_engine_check;
alter table if exists public.render_usage
  add constraint render_usage_engine_check
  check (engine in ('remotion', 'runway', 'veo', 'depth'));

alter table if exists public.render_jobs
  drop constraint if exists render_jobs_engine_check;
alter table if exists public.render_jobs
  add constraint render_jobs_engine_check
  check (engine in ('remotion', 'runway', 'veo', 'depth'));

commit;
