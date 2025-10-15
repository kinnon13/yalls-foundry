-- ========================================
-- HARDENING: Security + Phase 2 CRM Intake
-- ========================================

-- 1. Real has_role function (JWT-based for RLS policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb->>'role') = _role
    OR (_role = ANY(COALESCE(string_to_array(current_setting('request.jwt.claims', true)::jsonb->>'roles', ','), ARRAY[]::text[]))),
    false
  )
$$;

-- 2. CRM Events table (minimal for Phase 2 intake)
CREATE TABLE IF NOT EXISTS public.crm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  type text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_id uuid,
  contact_hint jsonb,
  anonymous_id text,
  source text NOT NULL DEFAULT 'web',
  ts timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_events ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
DROP POLICY IF EXISTS "Tenant isolation for crm_events" ON public.crm_events;
CREATE POLICY "Tenant isolation for crm_events"
  ON public.crm_events
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_crm_events_tenant_ts 
  ON public.crm_events(tenant_id, ts DESC);

CREATE INDEX IF NOT EXISTS idx_crm_events_type 
  ON public.crm_events(tenant_id, type, ts DESC);

CREATE INDEX IF NOT EXISTS idx_crm_events_contact 
  ON public.crm_events(tenant_id, contact_id, ts DESC) 
  WHERE contact_id IS NOT NULL;

COMMENT ON TABLE public.crm_events IS 
  'Event stream for CRM analytics and automation triggers';