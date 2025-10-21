-- Insert dynamic personas feature flag (using existing feature_flags table structure)
INSERT INTO public.feature_flags (
  id,
  feature_key, 
  name,
  description, 
  enabled,
  category,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'dynamic_personas_enabled',
  'Dynamic Persona Customization',
  'Enable dynamic voice and name customization per organization and user',
  false,
  'experimental',
  now(),
  now()
)
ON CONFLICT (feature_key) DO NOTHING;

-- RPC to get feature flag by key (works with existing schema)
CREATE OR REPLACE FUNCTION public.get_feature_flag(flag_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT enabled FROM public.feature_flags WHERE feature_key = flag_key),
    false
  );
END;
$$;

-- RPC to set feature flag (super admin only)
CREATE OR REPLACE FUNCTION public.set_feature_flag(
  flag_key TEXT,
  flag_enabled BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can modify feature flags';
  END IF;

  -- Update the flag
  UPDATE public.feature_flags
  SET 
    enabled = flag_enabled,
    updated_at = now()
  WHERE feature_key = flag_key;

  RETURN flag_enabled;
END;
$$;