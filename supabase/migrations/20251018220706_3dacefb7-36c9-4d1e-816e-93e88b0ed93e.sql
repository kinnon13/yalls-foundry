-- Add unique handle column to entities table for businesses, horses, etc.
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS handle citext UNIQUE;

-- Add index for faster handle lookups on entities
CREATE INDEX IF NOT EXISTS idx_entities_handle ON entities(handle);

-- Add comment explaining the handle field
COMMENT ON COLUMN entities.handle IS 'Unique username handle for @mentions and entity identification across all entity types (business, horse, farm, etc.)';

-- Create a trigger to auto-generate handle from display_name if not set for entities
CREATE OR REPLACE FUNCTION generate_entity_handle()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if handle is null and display_name exists
  IF NEW.handle IS NULL AND NEW.display_name IS NOT NULL THEN
    NEW.handle := slugify(NEW.display_name) || '_' || substring(NEW.id::text from 1 for 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to entities table
DROP TRIGGER IF EXISTS set_entity_handle ON entities;
CREATE TRIGGER set_entity_handle
  BEFORE INSERT OR UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION generate_entity_handle();