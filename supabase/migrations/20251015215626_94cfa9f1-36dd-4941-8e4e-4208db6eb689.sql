-- ========================================
-- FIX: Use JWT tenant_id for RLS (not auth.uid())
-- ========================================

-- 1. Ensure app schema exists
CREATE SCHEMA IF NOT EXISTS app;

-- 2. Create/replace tenant resolver from JWT claims
CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb->>'tenant_id','')::uuid
$$;

-- 3. Set default on crm_events (fallback to auth.uid() in dev)
ALTER TABLE public.crm_events 
  ALTER COLUMN tenant_id SET DEFAULT COALESCE(app.current_tenant_id(), auth.uid());

-- 4. Fix RLS policy to use JWT tenant claim
DROP POLICY IF EXISTS "Tenant isolation for crm_events" ON public.crm_events;
CREATE POLICY "Tenant isolation for crm_events"
  ON public.crm_events
  FOR ALL
  USING (tenant_id = COALESCE(app.current_tenant_id(), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(app.current_tenant_id(), auth.uid()));

-- 5. Validate no NULL tenant_ids remain before enforcing NOT NULL
DO $$
DECLARE
  null_count int;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.crm_events WHERE tenant_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE WARNING 'Found % rows with NULL tenant_id in crm_events', null_count;
  ELSE
    -- Safe to enforce NOT NULL
    ALTER TABLE public.crm_events ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;