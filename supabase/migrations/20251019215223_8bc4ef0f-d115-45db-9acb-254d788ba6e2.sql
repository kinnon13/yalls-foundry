
-- Production Infrastructure: Cron + Monitoring Views

-- 1) Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2) Schedule rocker-discovery to run every 5 minutes
SELECT cron.schedule(
  'rocker-discovery-worker',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/rocker-discovery',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 3) Monitoring Views for Observability

-- Queue Health Dashboard
CREATE OR REPLACE VIEW public.vw_discovery_queue_health AS
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE attempts > 3) as high_retry_count,
  MIN(created_at) as oldest_queued,
  MAX(updated_at) as last_activity
FROM public.marketplace_discovery_queue
GROUP BY status;

COMMENT ON VIEW public.vw_discovery_queue_health IS 
'Real-time discovery queue status for monitoring worker health';

-- Supply Gaps Dashboard
CREATE OR REPLACE VIEW public.vw_marketplace_gaps_critical AS
SELECT 
  ic.domain,
  ic.category,
  ic.tag,
  mc.slug as category_slug,
  mc.name as category_name,
  g.gap_level,
  g.inventory_ct,
  g.last_checked,
  (SELECT COUNT(*) FROM public.user_interests ui WHERE ui.interest_id = g.interest_id) as user_demand
FROM public.marketplace_gaps g
JOIN public.interest_catalog ic ON ic.id = g.interest_id
LEFT JOIN public.marketplace_interest_map im ON im.interest_id = g.interest_id
LEFT JOIN public.marketplace_categories mc ON mc.id = im.category_id
WHERE g.gap_level IN ('critical', 'low')
ORDER BY 
  CASE g.gap_level WHEN 'critical' THEN 1 WHEN 'low' THEN 2 ELSE 3 END,
  user_demand DESC,
  g.inventory_ct ASC;

COMMENT ON VIEW public.vw_marketplace_gaps_critical IS 
'Priority gaps ordered by severity and user demand for inventory sourcing';

-- Suggestions Performance
CREATE OR REPLACE VIEW public.vw_suggestions_coverage AS
SELECT 
  ic.domain,
  COUNT(DISTINCT ui.user_id) as users_with_interest,
  COUNT(DISTINCT CASE WHEN g.inventory_ct > 0 THEN ui.user_id END) as users_with_inventory,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN g.inventory_ct > 0 THEN ui.user_id END) / 
    NULLIF(COUNT(DISTINCT ui.user_id), 0), 
    1
  ) as coverage_pct,
  SUM(COALESCE(g.inventory_ct, 0)) as total_inventory
FROM public.user_interests ui
JOIN public.interest_catalog ic ON ic.id = ui.interest_id
LEFT JOIN public.marketplace_gaps g ON g.interest_id = ui.interest_id
WHERE ic.is_active
GROUP BY ic.domain
ORDER BY coverage_pct ASC;

COMMENT ON VIEW public.vw_suggestions_coverage IS 
'Marketplace coverage by domain showing which interests need more inventory';

-- RLS: Read-only for authenticated users, full access for admins
ALTER VIEW public.vw_discovery_queue_health SET (security_invoker = on);
ALTER VIEW public.vw_marketplace_gaps_critical SET (security_invoker = on);
ALTER VIEW public.vw_suggestions_coverage SET (security_invoker = on);
