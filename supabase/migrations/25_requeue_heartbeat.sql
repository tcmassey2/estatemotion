-- 25: heartbeat-based stuck-job requeue (v31 pipeline audit), 2026-07-01.
--
-- Problem: requeue_stuck_render_jobs() keyed off claimed_at alone, so any job
-- legitimately running longer than the timeout got requeued WHILE STILL
-- RUNNING — a second worker claimed it, doubling fal.ai spend and racing both
-- workers' writes on the same render_jobs row. v31's denser plans (up to 17
-- scenes at 60s) make >20-minute renders a real occurrence, not a tail case.
--
-- Fix: workers now heartbeat via render_jobs.heartbeat_at on every progress
-- update (multiple per minute during honest work). A job is only "stuck" when
-- its heartbeat (or claim, if it never heartbeat) is stale — i.e. the worker
-- actually died.

alter table public.render_jobs add column if not exists heartbeat_at timestamptz;

create or replace function public.requeue_stuck_render_jobs(p_timeout_minutes integer default 20)
returns integer
language plpgsql security definer as $$
declare n integer;
begin
  with bumped as (
    update public.render_jobs
      set status     = case when attempts >= 3 then 'failed' else 'queued' end,
          error      = case when attempts >= 3
                            then 'Render worker died mid-job (max attempts reached)'
                            else error end,
          claimed_at = null,
          heartbeat_at = null
      where status = 'rendering'
        and claimed_at is not null
        and coalesce(heartbeat_at, claimed_at) < now() - make_interval(mins => p_timeout_minutes)
      returning 1
  )
  select count(*) into n from bumped;
  return n;
end $$;

comment on function public.requeue_stuck_render_jobs is
  'Return render jobs whose worker heartbeat went stale back to queued (or fail after 3 tries). Heartbeat-based since migration 25 — long-running healthy jobs are never requeued.';
