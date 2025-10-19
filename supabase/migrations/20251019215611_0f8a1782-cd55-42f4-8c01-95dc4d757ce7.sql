-- Idempotency: prevent duplicate discovery queue entries
ALTER TABLE public.marketplace_discovery_queue
  ADD CONSTRAINT uq_discovery_uniqueness
  UNIQUE (interest_id, category_id, reason);

-- Dead-letter safety: promote to error after N tries
CREATE OR REPLACE FUNCTION public.discovery_mark_error(p_id uuid, p_msg text)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.marketplace_discovery_queue
  SET status = CASE WHEN attempts >= 4 THEN 'error' ELSE 'queued' END,
      attempts = attempts + 1,
      last_error = COALESCE(p_msg,'')
  WHERE id = p_id;
$$;

-- Drop existing view to recreate with new columns
DROP VIEW IF EXISTS public.vw_discovery_queue_health CASCADE;

-- Observability: Discovery queue health with p95 age
CREATE VIEW public.vw_discovery_queue_health AS
SELECT
  status,
  count(*) AS ct,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (now() - created_at))) AS p95_age_sec
FROM public.marketplace_discovery_queue
GROUP BY status;

-- Observability: Gap severity by domain/category
CREATE VIEW public.vw_gap_severity AS
SELECT
  ic.domain,
  ic.category,
  mg.gap_level,
  mg.inventory_ct,
  mg.last_checked
FROM public.marketplace_gaps mg
JOIN public.interest_catalog ic ON ic.id = mg.interest_id;

-- RLS: Read-only for authenticated users
ALTER VIEW public.vw_discovery_queue_health SET (security_invoker = on);
ALTER VIEW public.vw_gap_severity SET (security_invoker = on);