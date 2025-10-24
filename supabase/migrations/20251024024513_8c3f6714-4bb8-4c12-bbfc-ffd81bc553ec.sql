-- Wire Andy's learning system to run automatically
-- This fixes the issue where learning functions were defined but never triggered

-- Schedule andy-auto-analyze to run every 10 minutes
SELECT cron.schedule(
  'andy-auto-analyze-continuous',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url:='https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/andy-auto-analyze',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Schedule andy-expand-memory to run every hour
SELECT cron.schedule(
  'andy-expand-memory-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/andy-expand-memory',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Schedule andy-enhance-memories to run every 2 hours
SELECT cron.schedule(
  'andy-enhance-memories-2hourly',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url:='https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/andy-enhance-memories',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Andy learning system automated: auto-analyze (10min), expand-memory (1hr), enhance-memories (2hr)';