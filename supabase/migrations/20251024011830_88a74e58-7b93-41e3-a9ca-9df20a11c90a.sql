-- Update ai_cron_jobs table to match cron_tick expectations
-- Add missing columns
ALTER TABLE ai_cron_jobs 
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS schedule TEXT;

-- Migrate existing cron field to schedule if needed
UPDATE ai_cron_jobs SET schedule = cron WHERE schedule IS NULL AND cron IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN ai_cron_jobs.schedule IS 'Cron schedule in rate(Nm|Ns|Nh) format';
COMMENT ON COLUMN ai_cron_jobs.topic IS 'Event topic to trigger (matches edge function name)';

-- Make tenant_id optional (for global cron jobs)
ALTER TABLE ai_cron_jobs ALTER COLUMN tenant_id DROP NOT NULL;

-- Create index for efficient cron tick queries
CREATE INDEX IF NOT EXISTS idx_ai_cron_jobs_next_run 
  ON ai_cron_jobs(next_run_at) 
  WHERE enabled = true;