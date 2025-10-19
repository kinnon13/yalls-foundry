-- Simple test: just add lease columns
ALTER TABLE public.marketplace_discovery_queue
  ADD COLUMN IF NOT EXISTS lease_token uuid,
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz;

-- Verify they were added
SELECT column_name 
FROM information_schema.columns
WHERE table_name='marketplace_discovery_queue' 
  AND column_name IN ('lease_token','lease_expires_at');