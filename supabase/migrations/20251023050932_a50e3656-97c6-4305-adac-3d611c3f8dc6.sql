-- Enable pg_cron and pg_net extensions for scheduled edge functions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule red_team_tick: Daily at 2 AM UTC (bias & drift detection)
SELECT cron.schedule(
  'red-team-bias-detection',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/red_team_tick',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb,
    body := jsonb_build_object('time', now())
  );
  $$
);

-- Schedule user_rag_index: Every 6 hours (embeddings generation)
SELECT cron.schedule(
  'user-rag-embeddings',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/user_rag_index',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb,
    body := jsonb_build_object('time', now())
  );
  $$
);

-- Schedule fine_tune_cohort: Weekly on Monday at 1 AM UTC (cohort analysis)
SELECT cron.schedule(
  'fine-tune-cohort-analysis',
  '0 1 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/fine_tune_cohort',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb,
    body := jsonb_build_object('time', now())
  );
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Scheduled edge function execution for AI workers';
COMMENT ON EXTENSION pg_net IS 'HTTP requests for cron-triggered functions';