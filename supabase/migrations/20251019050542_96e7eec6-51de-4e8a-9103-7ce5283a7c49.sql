-- Add timestamp column to ai_action_ledger (rename created_at if needed)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_action_ledger' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_action_ledger' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE public.ai_action_ledger RENAME COLUMN created_at TO timestamp;
  END IF;
END $$;

-- Add hash columns for chain integrity (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_action_ledger' AND column_name = 'prev_hash') THEN
    ALTER TABLE public.ai_action_ledger ADD COLUMN prev_hash TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_action_ledger' AND column_name = 'hash') THEN
    ALTER TABLE public.ai_action_ledger ADD COLUMN hash TEXT;
  END IF;
END $$;

-- Create rocker_events table if not exists
CREATE TABLE IF NOT EXISTS public.rocker_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_ledger_user_time ON public.ai_action_ledger(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_ledger_action ON public.ai_action_ledger(action);
CREATE INDEX IF NOT EXISTS idx_rocker_events_user_time ON public.rocker_events(user_id, timestamp DESC);

-- Enable RLS on rocker_events
ALTER TABLE public.rocker_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy for rocker_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rocker_events' AND policyname = 'Users view own events'
  ) THEN
    CREATE POLICY "Users view own events" ON public.rocker_events
      FOR SELECT USING (auth.uid()::text = user_id::text);
  END IF;
END $$;