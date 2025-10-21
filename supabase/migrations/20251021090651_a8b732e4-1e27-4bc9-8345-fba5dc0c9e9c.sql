-- Add proactive settings columns to super_admin_settings
ALTER TABLE super_admin_settings
ADD COLUMN IF NOT EXISTS allow_proactive_suggestions boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_memory_ingest boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_knowledge_write boolean DEFAULT true;

-- Enable proactive features for existing super admin
UPDATE super_admin_settings
SET 
  allow_proactive_suggestions = true,
  allow_memory_ingest = true,
  allow_knowledge_write = true
WHERE user_id = 'f6952613-af22-467d-b790-06dfc7efbdbd';

-- Add comment for clarity
COMMENT ON COLUMN super_admin_settings.allow_proactive_suggestions IS 'Enables Andy to proactively suggest tasks, insights, and actions';
COMMENT ON COLUMN super_admin_settings.allow_memory_ingest IS 'Allows Andy to automatically learn from user interactions and ingest new knowledge';
COMMENT ON COLUMN super_admin_settings.allow_knowledge_write IS 'Permits Andy to write/update knowledge base entries autonomously';