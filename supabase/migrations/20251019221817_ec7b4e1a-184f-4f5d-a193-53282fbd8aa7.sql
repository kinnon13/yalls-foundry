-- Create lease/ack/fail functions for discovery queue
CREATE OR REPLACE FUNCTION public.lease_discovery_items(p_limit int, p_ttl_seconds int)
RETURNS SETOF public.marketplace_discovery_queue
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.marketplace_discovery_queue e
     SET status = 'processing',
         lease_token = gen_random_uuid(),
         lease_expires_at = now() + (p_ttl_seconds || ' seconds')::interval,
         updated_at = now()
   WHERE id IN (
     SELECT id FROM public.marketplace_discovery_queue
      WHERE status = 'queued' 
         OR (status = 'processing' AND lease_expires_at < now())
      ORDER BY created_at
      LIMIT p_limit
      FOR UPDATE SKIP LOCKED
   )
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION public.ack_discovery_item(p_id uuid, p_token uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.marketplace_discovery_queue
     SET status='done', 
         updated_at=now(), 
         lease_token=null, 
         lease_expires_at=null
   WHERE id = p_id
     AND lease_token = p_token
     AND (lease_expires_at IS NULL OR lease_expires_at >= now());
$$;

CREATE OR REPLACE FUNCTION public.fail_discovery_item(p_id uuid, p_token uuid, p_error text)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.marketplace_discovery_queue
     SET status = CASE WHEN attempts >= 4 THEN 'error' ELSE 'queued' END,
         attempts = attempts + 1,
         last_error = p_error,
         updated_at = now(),
         lease_token = null,
         lease_expires_at = null
   WHERE id = p_id
     AND lease_token = p_token
     AND (lease_expires_at IS NULL OR lease_expires_at >= now());
$$;

-- Create wrapper functions for worker compatibility
CREATE OR REPLACE FUNCTION public.lease_events(p_topic text, p_limit int, p_ttl_seconds int)
RETURNS SETOF public.marketplace_discovery_queue
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.lease_discovery_items(p_limit, p_ttl_seconds);
$$;

CREATE OR REPLACE FUNCTION public.ack_event(p_id uuid, p_token uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT public.ack_discovery_item(p_id, p_token);
$$;

CREATE OR REPLACE FUNCTION public.fail_event(p_id uuid, p_token uuid, p_error text)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT public.fail_discovery_item(p_id, p_token, p_error);
$$;