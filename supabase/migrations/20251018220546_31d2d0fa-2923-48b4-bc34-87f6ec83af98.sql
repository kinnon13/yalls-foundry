-- Add unique handle column to profiles table
-- Using citext for case-insensitive unique handles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS handle citext UNIQUE;

-- Add index for faster handle lookups
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);

-- Add comment explaining the handle field
COMMENT ON COLUMN profiles.handle IS 'Unique username handle for @mentions and user identification';

-- Create a trigger to auto-generate handle from display_name if not set
CREATE OR REPLACE FUNCTION generate_handle_from_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if handle is null and display_name exists
  IF NEW.handle IS NULL AND NEW.display_name IS NOT NULL THEN
    NEW.handle := slugify(NEW.display_name) || '_' || substring(NEW.user_id::text from 1 for 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS set_profile_handle ON profiles;
CREATE TRIGGER set_profile_handle
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_handle_from_name();