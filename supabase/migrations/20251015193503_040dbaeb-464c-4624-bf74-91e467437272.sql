-- Allow owner_id to be NULL for unclaimed profiles
ALTER TABLE entity_profiles ALTER COLUMN owner_id DROP NOT NULL;

-- Add created_by column to track who created the profile
ALTER TABLE entity_profiles ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Add check constraint to ensure owner_id is set when is_claimed is true
ALTER TABLE entity_profiles DROP CONSTRAINT IF EXISTS entity_profiles_owner_id_required_when_claimed;
ALTER TABLE entity_profiles ADD CONSTRAINT entity_profiles_owner_id_required_when_claimed 
  CHECK ((is_claimed = false) OR (is_claimed = true AND owner_id IS NOT NULL));

-- Update RLS policies to allow users to create unclaimed profiles
CREATE POLICY "Users can create unclaimed profiles" 
ON entity_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (is_claimed = false OR owner_id = auth.uid());