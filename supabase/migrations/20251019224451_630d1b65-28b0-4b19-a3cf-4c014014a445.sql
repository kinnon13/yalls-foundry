-- Runtime Flags System (production-grade safe mode & learning control)
-- Separate from the existing feature_flags UI table

CREATE TABLE IF NOT EXISTS public.runtime_flags (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Per-user overrides
CREATE TABLE IF NOT EXISTS public.runtime_flag_overrides (
  key        text NOT NULL,
  user_id    uuid NOT NULL,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key, user_id)
);

-- Add FK after both tables exist
DO $$ BEGIN
  ALTER TABLE public.runtime_flag_overrides
    ADD CONSTRAINT fk_runtime_overrides_key 
    FOREIGN KEY (key) REFERENCES public.runtime_flags(key) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS
ALTER TABLE public.runtime_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_flag_overrides ENABLE ROW LEVEL SECURITY;

-- Everyone can read flags
DROP POLICY IF EXISTS "runtime_flags_read_all" ON public.runtime_flags;
CREATE POLICY "runtime_flags_read_all" ON public.runtime_flags 
  FOR SELECT USING (true);

-- Users can read their own overrides
DROP POLICY IF EXISTS "runtime_overrides_read_own" ON public.runtime_flag_overrides;
CREATE POLICY "runtime_overrides_read_own" ON public.runtime_flag_overrides 
  FOR SELECT USING (auth.uid() = user_id);

-- Only super admins can write flags
DROP POLICY IF EXISTS "runtime_flags_admin_write" ON public.runtime_flags;
CREATE POLICY "runtime_flags_admin_write" ON public.runtime_flags 
  FOR ALL USING (public.is_super_admin()) 
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "runtime_overrides_admin_write" ON public.runtime_flag_overrides;
CREATE POLICY "runtime_overrides_admin_write" ON public.runtime_flag_overrides 
  FOR ALL USING (public.is_super_admin()) 
  WITH CHECK (public.is_super_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rtf_updated_at ON public.runtime_flags(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rtfo_user ON public.runtime_flag_overrides(user_id, key);

-- Bootstrap values
INSERT INTO public.runtime_flags(key, value, description) VALUES
  ('global.safe_mode', '{"enabled": false}'::jsonb, 'Kill switch: exploration off'),
  ('learning.enabled', '{"enabled": true, "rollout": 1.0}'::jsonb, 'Bandits + reward logging'),
  ('rocker.conversation', '{"enabled": true, "min_probe_gap_sec": 90}'::jsonb, 'Back-and-forth interview'),
  ('rocker.nudges', '{"enabled": true, "mode": "adhd", "interval_min": 10}'::jsonb, 'Focus nudges'),
  ('ranker.epsilon', '{"value": 0.08, "mobile": 0.12, "desktop": 0.08}'::jsonb, 'Exploration rate'),
  ('marketplace.suggestions', '{"enabled": true, "rollout": 1.0}'::jsonb, 'Marketplace UX')
ON CONFLICT (key) DO UPDATE 
  SET value = EXCLUDED.value, 
      description = EXCLUDED.description, 
      updated_at = now();