-- Ensure Rocker entity exists
INSERT INTO public.entities (
  id,
  kind,
  display_name,
  handle,
  status,
  metadata,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'person'::entity_kind,
  'Rocker',
  'rocker',
  'verified',
  '{"avatar_url": "/rocker-cowboy-avatar.jpeg", "is_system": true}'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- Function to automatically pin Rocker for new users
CREATE OR REPLACE FUNCTION public.auto_pin_rocker_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert Rocker pin for the new user
  INSERT INTO public.user_pins (
    user_id,
    pin_type,
    ref_id,
    section,
    sort_index,
    is_public
  )
  VALUES (
    NEW.user_id,
    'entity'::pin_type,
    '00000000-0000-0000-0000-000000000001',
    'home',
    0,
    true
  )
  ON CONFLICT (user_id, pin_type, ref_id, section) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-pin Rocker when a profile is created
DROP TRIGGER IF EXISTS trigger_auto_pin_rocker ON public.profiles;
CREATE TRIGGER trigger_auto_pin_rocker
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_pin_rocker_for_user();

-- Pin Rocker for all existing users who don't have it yet
INSERT INTO public.user_pins (
  user_id,
  pin_type,
  ref_id,
  section,
  sort_index,
  is_public
)
SELECT DISTINCT
  p.user_id,
  'entity'::pin_type,
  '00000000-0000-0000-0000-000000000001',
  'home',
  0,
  true
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_pins up
  WHERE up.user_id = p.user_id
    AND up.pin_type = 'entity'::pin_type
    AND up.ref_id = '00000000-0000-0000-0000-000000000001'
    AND up.section = 'home'
)
ON CONFLICT (user_id, pin_type, ref_id, section) DO NOTHING;