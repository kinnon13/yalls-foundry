-- Add updated_at column to rocker_knowledge table
ALTER TABLE rocker_knowledge 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger to auto-update the timestamp
CREATE OR REPLACE FUNCTION update_rocker_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS rocker_knowledge_updated_at_trigger ON rocker_knowledge;

CREATE TRIGGER rocker_knowledge_updated_at_trigger
BEFORE UPDATE ON rocker_knowledge
FOR EACH ROW
EXECUTE FUNCTION update_rocker_knowledge_updated_at();