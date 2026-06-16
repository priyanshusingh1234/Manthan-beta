-- Enable the required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- This is the cron job.
-- The schedule is "30 13 * * *" which maps to 1:30 PM UTC (7:00 PM IST exactly).
-- Note: Replace "YOUR_VERCEL_CRON_SECRET" with your actual Vercel CRON_SECRET value found in your Vercel Dashboard env vars!
-- Note: Replace "https://your-production-url.vercel.app" with your actual Vercel production URL.

SELECT cron.schedule(
  'boss_spawn_daily',
  '30 13 * * *',
  $$
  SELECT net.http_post(
      url:='https://manthan-beta-c975.vercel.app/api/boss/trigger-spawn',
      headers:='{"Authorization": "pass-kahebataye"}'::jsonb
  );
  $$
);

-- If you ever need to unschedule it, run this:
-- SELECT cron.unschedule('boss_spawn_daily');
