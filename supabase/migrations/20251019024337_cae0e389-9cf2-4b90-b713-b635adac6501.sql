-- Ensure Rocker is always first in favorites by setting sort_index to -1000
UPDATE public.user_pins
SET sort_index = -1000
WHERE ref_id = '00000000-0000-0000-0000-000000000001'
  AND pin_type = 'entity'
  AND section = 'home';

-- Update the trigger to ensure Rocker gets sort_index -1000 for new users
CREATE OR REPLACE FUNCTION public.auto_favorite_rocker()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.favorites (user_id, fav_type, ref_id)
  VALUES (NEW.user_id, 'entity', '00000000-0000-0000-0000-000000000001')
  ON CONFLICT DO NOTHING;
  
  -- Also add to user_pins with fixed sort_index
  INSERT INTO public.user_pins (user_id, pin_type, ref_id, section, sort_index, is_public)
  VALUES (NEW.user_id, 'entity', '00000000-0000-0000-0000-000000000001', 'home', -1000, true)
  ON CONFLICT (user_id, pin_type, ref_id, section) DO UPDATE
  SET sort_index = -1000;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;