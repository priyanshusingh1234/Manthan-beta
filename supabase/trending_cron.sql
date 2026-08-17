-- 1. Enable required extensions for scheduled webhooks
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 2. Create the cron job
-- This schedules a job called 'trending-posts-cron' to run every 5 minutes (*/5 * * * *)
select cron.schedule(
  'trending-posts-cron',
  '*/5 * * * *',
  $$
    select net.http_post(
      url:='https://manthan-beta-c975.vercel.app/api/cron/trending',
      -- If you eventually set a CRON_SECRET in Vercel, you would pass it here like this:
      -- headers:='{"Authorization": "Bearer YOUR_SECRET_KEY"}'::jsonb
      headers:='{}'::jsonb
    );
  $$
);

-- ==========================================
-- USEFUL COMMANDS FOR MANAGING YOUR CRON JOB
-- ==========================================

-- Check if the job is scheduled properly:
-- select * from cron.job;

-- See the logs of past executions (if it succeeded or failed):
-- select * from cron.job_run_details order by start_time desc limit 10;

-- If you ever need to stop the automation, run this:
-- select cron.unschedule('trending-posts-cron');
