-- ============================================================================
-- CRITICAL FIX (FINAL): Correct all schema issues
-- ============================================================================

-- 1) FIX rocker_messages.role - MUST be chat role only
ALTER TABLE public.rocker_messages
  DROP CONSTRAINT IF EXISTS rocker_messages_role_check;

ALTER TABLE public.rocker_messages
  ADD CONSTRAINT rocker_messages_role_check
  CHECK (role IN ('user', 'assistant'));

-- Clean up any persona keys that leaked into role column
UPDATE public.rocker_messages
SET role = 'assistant'
WHERE role IN ('user_rocker', 'admin_rocker', 'super_andy');

-- 2) ADD actor_role to threads (if missing)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'rocker_threads' 
      AND column_name = 'actor_role'
  ) THEN
    ALTER TABLE public.rocker_threads
      ADD COLUMN actor_role TEXT DEFAULT 'user_rocker';
  END IF;
END $$;

-- Add constraint on actor_role
ALTER TABLE public.rocker_threads
  DROP CONSTRAINT IF EXISTS rocker_threads_actor_role_check;

ALTER TABLE public.rocker_threads
  ADD CONSTRAINT rocker_threads_actor_role_check
  CHECK (actor_role IN ('user_rocker', 'admin_rocker', 'super_andy'));

-- Backfill actor_role from any legacy values
UPDATE public.rocker_threads
SET actor_role = CASE
  WHEN actor_role IN ('user', 'user_rocker') THEN 'user_rocker'
  WHEN actor_role IN ('admin', 'admin_rocker') THEN 'admin_rocker'
  WHEN actor_role IN ('super', 'super_rocker', 'knower', 'super_andy') THEN 'super_andy'
  ELSE 'user_rocker'
END
WHERE actor_role IS NULL 
   OR actor_role NOT IN ('user_rocker', 'admin_rocker', 'super_andy');

-- Set NOT NULL after backfill
ALTER TABLE public.rocker_threads
  ALTER COLUMN actor_role SET NOT NULL;

-- 3) Backfill message meta with actor_role from thread (for auditing)
UPDATE public.rocker_messages m
SET meta = COALESCE(m.meta, '{}'::jsonb) || jsonb_build_object('actor_role', t.actor_role)
FROM public.rocker_threads t
WHERE m.thread_id = t.id
  AND m.role = 'assistant'
  AND (m.meta->>'actor_role') IS NULL;

-- 4) Use existing feature_flags table, just add our flag
INSERT INTO public.feature_flags (
  feature_key,
  name,
  description,
  enabled,
  category,
  config
)
VALUES (
  'dynamic_personas_enabled',
  'Dynamic Persona Customization',
  'Allow per-user/org voice and name overrides for AI personas',
  false,
  'voice',
  '{}'::jsonb
)
ON CONFLICT (feature_key) DO NOTHING;

-- 5) Update RPCs to work with existing schema
CREATE OR REPLACE FUNCTION public.get_feature_flag(flag_key TEXT)
RETURNS BOOLEAN
LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(enabled, false)
  FROM public.feature_flags
  WHERE feature_key = flag_key
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.set_feature_flag(flag_key TEXT, flag_enabled BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql VOLATILE SECURITY DEFINER AS $$
BEGIN
  -- Check if user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can modify feature flags';
  END IF;

  UPDATE public.feature_flags
  SET enabled = flag_enabled,
      updated_at = now()
  WHERE feature_key = flag_key;

  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_feature_flag(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_feature_flag(TEXT, BOOLEAN) TO authenticated;