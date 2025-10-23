-- Create cron schedules (fresh, no delete)
SELECT cron.schedule(
  'super-andy-perceive',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/perceive_tick',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'super-andy-improve',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/self_improve_tick',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'super-andy-redteam',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/red_team_tick',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb
  ) as request_id;
  $$
);