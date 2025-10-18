
-- Add visibility flag for public display of user pins
ALTER TABLE public.user_pins
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- Add helpful index for fetching public pins
CREATE INDEX IF NOT EXISTS idx_user_pins_public
  ON public.user_pins (user_id, pin_type, section, is_public, sort_index);

-- Comment
COMMENT ON COLUMN public.user_pins.is_public IS 'Whether this pin is visible on the user''s public profile';
