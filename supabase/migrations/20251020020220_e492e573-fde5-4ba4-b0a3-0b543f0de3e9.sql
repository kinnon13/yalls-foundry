-- 1. Runtime flags for feature toggles
CREATE TABLE IF NOT EXISTS public.runtime_flags (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.runtime_flags ENABLE ROW LEVEL SECURITY;

-- Policies: Admins manage, everyone reads
CREATE POLICY runtime_flags_admin_manage ON public.runtime_flags
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY runtime_flags_public_read ON public.runtime_flags
  FOR SELECT USING (true);

-- Insert Rocker Hub flags
INSERT INTO public.runtime_flags(key, value)
VALUES 
  ('rocker.hub.public_readonly', jsonb_build_object('enabled', false, 'description', 'Allow non-super-admins to view redacted Hub')),
  ('rocker.conversation', jsonb_build_object('enabled', true)),
  ('rocker.memory.long_term', jsonb_build_object('enabled', true, 'retention_days', null)),
  ('rocker.memory.super_admin_priority', jsonb_build_object('enabled', true, 'priority', 'super_admin')),
  ('learning.enabled', jsonb_build_object('enabled', true, 'rollout', 1.0)),
  ('global.safe_mode', jsonb_build_object('enabled', false))
ON CONFLICT (key) DO NOTHING;

-- 2. Audit logging for all privileged Rocker actions
CREATE TABLE IF NOT EXISTS public.rocker_admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rocker_admin_audit ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY rocker_audit_super_admin_view ON public.rocker_admin_audit
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY rocker_audit_system_insert ON public.rocker_admin_audit
  FOR INSERT WITH CHECK (true);

-- Add trigger to update runtime_flags timestamp
CREATE OR REPLACE FUNCTION update_runtime_flags_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER runtime_flags_update_timestamp
  BEFORE UPDATE ON public.runtime_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_runtime_flags_timestamp();