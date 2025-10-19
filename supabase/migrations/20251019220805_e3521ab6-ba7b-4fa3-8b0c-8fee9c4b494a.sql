-- Fix view conflicts - only create views for existing tables
DROP VIEW IF EXISTS public.vw_discovery_queue_health CASCADE;
DROP VIEW IF EXISTS public.vw_gap_severity CASCADE;
DROP VIEW IF EXISTS public.vw_kernel_slos CASCADE;
DROP VIEW IF EXISTS public.vw_events_queue_health CASCADE;

-- Discovery queue health (marketplace_discovery_queue exists)
CREATE VIEW public.vw_discovery_queue_health AS
SELECT
  status,
  COUNT(*) AS ct,
  COUNT(*) FILTER (WHERE attempts > 3) AS high_retry_ct,
  MIN(created_at) AS oldest_queued,
  MAX(updated_at) AS last_activity,
  percentile_disc(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (now() - created_at))) AS p95_age_sec
FROM public.marketplace_discovery_queue
GROUP BY status;

-- Gap severity (marketplace_gaps and interest_catalog exist)
CREATE VIEW public.vw_gap_severity AS
SELECT
  ic.domain,
  ic.category,
  mg.gap_level,
  COUNT(*) AS ct,
  AVG(mg.inventory_ct) AS avg_inventory
FROM public.marketplace_gaps mg
JOIN public.interest_catalog ic ON ic.id = mg.interest_id
GROUP BY ic.domain, ic.category, mg.gap_level;

-- Kernel SLOs (intent_signals exists)
CREATE VIEW public.vw_kernel_slos AS
SELECT 
  'auth.login' AS path, 
  percentile_disc(0.95) WITHIN GROUP (ORDER BY (metadata->>'lat_ms')::int) AS p95_ms
FROM public.intent_signals 
WHERE name = 'auth_login' AND ts > now() - interval '1 day'
UNION ALL
SELECT 
  'onboarding.submit', 
  percentile_disc(0.95) WITHIN GROUP (ORDER BY (metadata->>'lat_ms')::int) AS p95_ms
FROM public.intent_signals 
WHERE name = 'onboarding_complete' AND ts > now() - interval '1 day';

-- Set RLS for views
ALTER VIEW public.vw_discovery_queue_health SET (security_invoker = on);
ALTER VIEW public.vw_gap_severity SET (security_invoker = on);
ALTER VIEW public.vw_kernel_slos SET (security_invoker = on);