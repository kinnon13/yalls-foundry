-- Seed Data: Worker Pools and Cron Jobs
-- System-level configuration

-- 1) Worker pools with topic routing
INSERT INTO public.ai_worker_pools (pool, min_concurrency, max_concurrency, burst_concurrency, current_concurrency, topic_glob)
VALUES
  ('realtime', 53, 106, 212, 53, 'chat.*,notify.*,resume.*'),
  ('heavy', 35, 106, 141, 35, 'embed.*,crawl.*,retrain.*,vector.*'),
  ('safety', 9, 27, 35, 9, 'verify.*,policy.*,rollback.*'),
  ('admin', 18, 53, 71, 18, 'admin.*,report.*,export.*')
ON CONFLICT (pool) DO UPDATE SET
  min_concurrency = EXCLUDED.min_concurrency,
  max_concurrency = EXCLUDED.max_concurrency,
  burst_concurrency = EXCLUDED.burst_concurrency,
  topic_glob = EXCLUDED.topic_glob;

-- 2) Cron jobs for system maintenance
-- Using system tenant ID for global jobs
INSERT INTO public.ai_cron_jobs (key, tenant_id, region, cron, jitter_sec, next_run_at, enabled)
VALUES
  ('cron.tick', '00000000-0000-0000-0000-000000000000'::uuid, 'us', '* * * * *', 10, now(), true),
  ('watchdog.tick', '00000000-0000-0000-0000-000000000000'::uuid, 'us', '* * * * *', 10, now(), true),
  ('metrics.export', '00000000-0000-0000-0000-000000000000'::uuid, 'us', '* * * * *', 10, now(), true),
  ('dlq.replay', '00000000-0000-0000-0000-000000000000'::uuid, 'us', '*/5 * * * *', 30, now(), true),
  ('ctm.daily_report', '00000000-0000-0000-0000-000000000000'::uuid, 'us', '0 0 * * *', 120, now() + interval '1 day', true),
  ('perceive.tick', '00000000-0000-0000-0000-000000000000'::uuid, 'us', '*/10 * * * *', 60, now(), true)
ON CONFLICT (key) DO UPDATE SET
  cron = EXCLUDED.cron,
  jitter_sec = EXCLUDED.jitter_sec,
  enabled = EXCLUDED.enabled;