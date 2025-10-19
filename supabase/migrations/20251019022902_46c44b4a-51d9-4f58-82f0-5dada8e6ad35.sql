-- Ensure Rocker entity exists and is favorited by all users
-- This inserts Rocker if it doesn't exist
INSERT INTO public.entities (id, owner_user_id, display_name, kind, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Rocker',
  'person',
  '{"is_system": true, "is_ai": true, "bio": "Your AI assistant"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Add Rocker to favorites for all existing users
INSERT INTO public.favorites (user_id, fav_type, ref_id)
SELECT 
  p.user_id,
  'entity',
  '00000000-0000-0000-0000-000000000001'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.favorites f 
  WHERE f.user_id = p.user_id 
  AND f.ref_id = '00000000-0000-0000-0000-000000000001'
  AND f.fav_type = 'entity'
);

-- Create trigger function to auto-favorite Rocker for new users
CREATE OR REPLACE FUNCTION public.auto_favorite_rocker()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.favorites (user_id, fav_type, ref_id)
  VALUES (NEW.user_id, 'entity', '00000000-0000-0000-0000-000000000001')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_favorite_rocker ON public.profiles;

CREATE TRIGGER trigger_auto_favorite_rocker
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_favorite_rocker();