-- Fix schema: Add file_id to rocker_knowledge for proper file-chunk relationship
-- This allows FileBrowser to show chunks per file

-- Step 1: Add file_id column (nullable initially for existing data)
ALTER TABLE rocker_knowledge 
ADD COLUMN IF NOT EXISTS file_id UUID;

-- Step 2: Add foreign key constraint to rocker_files
ALTER TABLE rocker_knowledge
ADD CONSTRAINT rocker_knowledge_file_id_fkey 
FOREIGN KEY (file_id) REFERENCES rocker_files(id) ON DELETE CASCADE;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_rocker_knowledge_file_id 
ON rocker_knowledge(file_id);

-- Step 4: Create helper function to link orphaned chunks to files by matching metadata
CREATE OR REPLACE FUNCTION link_chunks_to_files()
RETURNS TABLE(linked_count bigint) AS $$
DECLARE
  v_count bigint := 0;
BEGIN
  -- Link chunks to files where they share the same source and were created around the same time
  UPDATE rocker_knowledge rk
  SET file_id = rf.id
  FROM rocker_files rf
  WHERE rk.file_id IS NULL
    AND rk.user_id = rf.user_id
    AND rk.meta->>'source' = rf.source
    AND rk.created_at >= rf.created_at - INTERVAL '5 minutes'
    AND rk.created_at <= rf.created_at + INTERVAL '5 minutes';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Run initial linking for existing data
SELECT * FROM link_chunks_to_files();

COMMENT ON COLUMN rocker_knowledge.file_id IS 'Links chunks to their parent file for UI display';
COMMENT ON FUNCTION link_chunks_to_files() IS 'Helper to retroactively link orphaned chunks to files';
