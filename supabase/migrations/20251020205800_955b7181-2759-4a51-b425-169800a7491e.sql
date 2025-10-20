-- Add project field for micro-level organization
ALTER TABLE public.rocker_files 
ADD COLUMN IF NOT EXISTS project text;

-- Create index for project-based queries
CREATE INDEX IF NOT EXISTS idx_rocker_files_project 
ON public.rocker_files(user_id, project, category);

-- Update folder_path to support deep nesting (increase length if needed)
COMMENT ON COLUMN public.rocker_files.folder_path IS 'Full micro-level path: Project/Phase/Category/Subcategory';

-- Add function to extract project from folder_path
CREATE OR REPLACE FUNCTION extract_project_from_path()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-extract project from folder_path if not set
  IF NEW.folder_path IS NOT NULL AND NEW.project IS NULL THEN
    NEW.project := split_part(NEW.folder_path, '/', 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-extract project
DROP TRIGGER IF EXISTS trg_extract_project ON public.rocker_files;
CREATE TRIGGER trg_extract_project
  BEFORE INSERT OR UPDATE ON public.rocker_files
  FOR EACH ROW
  EXECUTE FUNCTION extract_project_from_path();