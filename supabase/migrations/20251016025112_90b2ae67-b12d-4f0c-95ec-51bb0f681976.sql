-- Add remaining fields to ai_feedback for complete logging
ALTER TABLE ai_feedback
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;