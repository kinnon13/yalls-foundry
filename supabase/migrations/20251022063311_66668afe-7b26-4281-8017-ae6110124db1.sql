-- Admin Identity & Control Flags Schema

-- Super admins table (you = root)
CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id uuid PRIMARY KEY,
  added_at timestamptz DEFAULT now(),
  added_by uuid,
  notes text
);

-- Global control flags (exactly one row)
CREATE TABLE IF NOT EXISTS public.ai_control_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  global_pause boolean DEFAULT false,
  write_freeze boolean DEFAULT false,
  external_calls_enabled boolean DEFAULT true,
  burst_override boolean DEFAULT false,
  last_reason text,
  last_changed_by uuid,
  changed_at timestamptz DEFAULT now()
);

-- Ensure only one row in ai_control_flags
CREATE OR REPLACE FUNCTION ensure_single_control_flags()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.ai_control_flags) > 0 THEN
    RAISE EXCEPTION 'Only one control flags row allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_control_flags
  BEFORE INSERT ON public.ai_control_flags
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_control_flags();

-- Initialize the single control flags row
INSERT INTO public.ai_control_flags (id, global_pause, write_freeze, external_calls_enabled, burst_override)
VALUES (gen_random_uuid(), false, false, true, false)
ON CONFLICT DO NOTHING;

-- Scoped control (per pool/tenant/topic/region)
CREATE TABLE IF NOT EXISTS public.ai_control_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text CHECK (scope_type IN ('pool','tenant','topic','region')) NOT NULL,
  scope_key text NOT NULL,
  paused boolean DEFAULT false,
  reason text,
  changed_by uuid,
  changed_at timestamptz DEFAULT now(),
  UNIQUE(scope_type, scope_key)
);

CREATE INDEX IF NOT EXISTS ai_control_scopes_type_key_idx ON public.ai_control_scopes(scope_type, scope_key);
CREATE INDEX IF NOT EXISTS ai_control_scopes_paused_idx ON public.ai_control_scopes(paused) WHERE paused = true;

-- Kill events log (audit trail)
CREATE TABLE IF NOT EXISTS public.ai_kill_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text CHECK (level IN ('global','pool','tenant','topic','region')) NOT NULL,
  key text,
  action text NOT NULL,
  requested_by uuid,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_kill_events_created_idx ON public.ai_kill_events(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_kill_events_level_idx ON public.ai_kill_events(level);

-- RLS Policies
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_control_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_control_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_kill_events ENABLE ROW LEVEL SECURITY;

-- super_admins: service role can manage, authenticated can read (to check if they're admin)
CREATE POLICY super_admins_read ON public.super_admins
  FOR SELECT USING (true);

CREATE POLICY super_admins_manage ON public.super_admins
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.super_admins)
  );

-- ai_control_flags: service role can write, workers can read
CREATE POLICY ai_control_flags_read ON public.ai_control_flags
  FOR SELECT USING (true);

CREATE POLICY ai_control_flags_write ON public.ai_control_flags
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.super_admins)
  );

-- ai_control_scopes: service role can write, workers can read
CREATE POLICY ai_control_scopes_read ON public.ai_control_scopes
  FOR SELECT USING (true);

CREATE POLICY ai_control_scopes_write ON public.ai_control_scopes
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.super_admins)
  );

-- ai_kill_events: service role can write, admins can read
CREATE POLICY ai_kill_events_read ON public.ai_kill_events
  FOR SELECT USING (true);

CREATE POLICY ai_kill_events_write ON public.ai_kill_events
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.super_admins)
  );