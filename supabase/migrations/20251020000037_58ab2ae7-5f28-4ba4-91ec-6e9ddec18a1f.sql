-- Allow 'system' (and other service identifiers) to be recorded in ai_action_ledger.agent
-- Idempotent migration replacing the restrictive CHECK constraint causing 23514 errors
DO $$ BEGIN
  -- Drop existing constraint if present
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'ai_action_ledger_agent_check'
      AND n.nspname = 'public'
      AND t.relname = 'ai_action_ledger'
  ) THEN
    ALTER TABLE public.ai_action_ledger DROP CONSTRAINT ai_action_ledger_agent_check;
  END IF;
END $$;

-- Add a permissive but safe check: non-empty, lowercase service-style identifier
-- Examples allowed: 'system', 'edge', 'worker', 'service:embedding', 'daemon_1'
ALTER TABLE public.ai_action_ledger
  ADD CONSTRAINT ai_action_ledger_agent_check
  CHECK (
    agent IS NOT NULL
    AND length(agent) BETWEEN 2 AND 64
    AND agent ~ '^[a-z][a-z0-9_:\-]*$'
  );

-- Optional: ensure agent column has an index if frequently filtered (no-op if exists)
CREATE INDEX IF NOT EXISTS idx_ai_action_ledger_agent ON public.ai_action_ledger(agent);
