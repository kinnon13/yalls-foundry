-- Add calendar privacy settings to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendar_public boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendar_settings jsonb DEFAULT '{"show_busy_only": false, "hide_details": false, "allowed_viewers": []}'::jsonb;

COMMENT ON COLUMN public.profiles.calendar_public IS 'Whether the user''s calendar is publicly visible';
COMMENT ON COLUMN public.profiles.calendar_settings IS 'Advanced calendar privacy settings';

-- Function to check if a user can view another user's calendar
CREATE OR REPLACE FUNCTION public.can_view_calendar(viewer_id uuid, calendar_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_public boolean;
  settings jsonb;
  allowed_viewers jsonb;
BEGIN
  -- Owner can always view their own calendar
  IF viewer_id = calendar_owner_id THEN
    RETURN true;
  END IF;
  
  -- Check if calendar is public
  SELECT calendar_public, calendar_settings 
  INTO is_public, settings
  FROM profiles
  WHERE user_id = calendar_owner_id;
  
  -- If public, anyone can view
  IF is_public THEN
    RETURN true;
  END IF;
  
  -- Check allowed viewers list
  allowed_viewers := settings->'allowed_viewers';
  IF allowed_viewers IS NOT NULL AND allowed_viewers ? viewer_id::text THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Update RLS policy for calendar events to respect privacy settings
DROP POLICY IF EXISTS "Users can view events they have access to" ON calendar_events;
CREATE POLICY "Users can view events based on calendar access and privacy"
ON calendar_events
FOR SELECT
USING (
  has_calendar_access(calendar_id, auth.uid(), 'reader')
  OR EXISTS (
    SELECT 1 FROM calendars c
    WHERE c.id = calendar_events.calendar_id
    AND can_view_calendar(auth.uid(), c.owner_profile_id)
  )
);