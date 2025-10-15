-- Add missing columns for proper memory management
ALTER TABLE ai_user_memory 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS namespace TEXT,
ADD COLUMN IF NOT EXISTS sensitivity TEXT DEFAULT 'low' CHECK (sensitivity IN ('low', 'medium', 'high'));

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_user_memory_last_used ON ai_user_memory(user_id, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_user_memory_use_count ON ai_user_memory(user_id, use_count DESC);
CREATE INDEX IF NOT EXISTS idx_ai_user_memory_namespace ON ai_user_memory(user_id, namespace);

-- Update existing records to set namespace from key prefix
UPDATE ai_user_memory 
SET namespace = SPLIT_PART(key, '_', 1)
WHERE namespace IS NULL AND key LIKE '%_%';

-- Update last_used_at to match updated_at for existing records
UPDATE ai_user_memory 
SET last_used_at = updated_at
WHERE last_used_at IS NULL;