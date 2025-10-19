-- Ensure Rocker AI entity exists with proper metadata
INSERT INTO entities (
  id,
  kind,
  display_name,
  handle,
  status,
  metadata,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ai',
  'Rocker',
  'rocker',
  'verified',
  jsonb_build_object(
    'avatar_url', '/rocker-cowboy-avatar.jpeg',
    'description', 'Your AI assistant',
    'is_system', true
  ),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  status = EXCLUDED.status,
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle;

-- Function to auto-pin Rocker for a user
CREATE OR REPLACE FUNCTION auto_pin_rocker_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert Rocker pin with sort_index -1000 to ensure it's always first
  INSERT INTO user_pins (
    user_id,
    pin_type,
    ref_id,
    section,
    sort_index,
    is_public
  )
  VALUES (
    p_user_id,
    'entity',
    '00000000-0000-0000-0000-000000000001'::text,
    'home',
    -1000,
    true
  )
  ON CONFLICT (user_id, pin_type, ref_id, section) DO NOTHING;
END;
$$;

-- Trigger function to auto-pin Rocker when a profile is created
CREATE OR REPLACE FUNCTION trigger_auto_pin_rocker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM auto_pin_rocker_for_user(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created_pin_rocker ON profiles;
CREATE TRIGGER on_profile_created_pin_rocker
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_pin_rocker();

-- Backfill: Pin Rocker for all existing users who don't have it
INSERT INTO user_pins (user_id, pin_type, ref_id, section, sort_index, is_public)
SELECT 
  p.user_id,
  'entity',
  '00000000-0000-0000-0000-000000000001'::text,
  'home',
  -1000,
  true
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_pins up
  WHERE up.user_id = p.user_id
    AND up.pin_type = 'entity'
    AND up.ref_id = '00000000-0000-0000-0000-000000000001'
    AND up.section = 'home'
)
ON CONFLICT (user_id, pin_type, ref_id, section) DO NOTHING;