-- Fix outbox claim with CTE + SKIP LOCKED for atomic, ordered claiming
-- Plus batched finalization to reduce roundtrips

-- Add indexes for efficient claiming
CREATE INDEX IF NOT EXISTS idx_outbox_claimable
  ON public.outbox (delivered_at, created_at)
  WHERE delivered_at IS NULL AND processing_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_outbox_token
  ON public.outbox (processing_token)
  WHERE processing_token IS NOT NULL;

-- Atomic, ordered claim using CTE
CREATE OR REPLACE FUNCTION app.outbox_claim(
  p_limit int,
  p_token uuid,
  p_tenant uuid DEFAULT NULL
)
RETURNS SETOF public.outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Claim oldest first; SKIP LOCKED avoids contention between workers
  RETURN QUERY
  WITH to_claim AS (
    SELECT id
    FROM public.outbox
    WHERE delivered_at IS NULL
      AND processing_token IS NULL
      AND (p_tenant IS NULL OR tenant_id = p_tenant)
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.outbox o
     SET processing_token = p_token
    FROM to_claim c
   WHERE o.id = c.id
   RETURNING o.*;
END;
$$;

REVOKE ALL ON FUNCTION app.outbox_claim(int,uuid,uuid) FROM public;
GRANT EXECUTE ON FUNCTION app.outbox_claim(int,uuid,uuid) TO service_role;

-- Batched finalization: mark multiple rows delivered in one call
CREATE OR REPLACE FUNCTION app.outbox_mark_delivered(
  p_token uuid,
  p_ids uuid[]
)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.outbox o
     SET delivered_at = NOW(),
         attempts = COALESCE(o.attempts, 0) + 1,
         processing_token = NULL
   WHERE o.id = ANY(p_ids)
     AND o.processing_token = p_token;
  
  SELECT COUNT(*)::int FROM public.outbox
   WHERE id = ANY(p_ids) AND delivered_at IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION app.outbox_mark_delivered(uuid,uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION app.outbox_mark_delivered(uuid,uuid[]) TO service_role;

-- Identity resolution hardening: unique constraints for external_id and lowercase email
CREATE UNIQUE INDEX IF NOT EXISTS uniq_identity_external
  ON public.contact_identities(tenant_id, type, value)
  WHERE type = 'external_id';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_identity_email_lower
  ON public.contact_identities(tenant_id, type, LOWER(value))
  WHERE type = 'email';