-- Schedule cron_tick to run every minute to process due jobs
SELECT cron.schedule(
  'andy-cron-tick',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url:='https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/cron_tick',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);