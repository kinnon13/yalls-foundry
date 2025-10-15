-- Pack A: RBAC enhancements
-- Verify app_role enum exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure user_roles table has all needed columns
DO $$ BEGIN
  ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Pack C: Idempotency columns for critical tables
ALTER TABLE IF EXISTS public.commission_ledger
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD CONSTRAINT commission_ledger_idem UNIQUE (idempotency_key);

-- Create idempotency tracking table for general use
CREATE TABLE IF NOT EXISTS public.idempotency_log (
  key text PRIMARY KEY,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '1 hour'
);

ALTER TABLE public.idempotency_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage idempotency log"
ON public.idempotency_log
FOR ALL
USING (true)
WITH CHECK (true);

-- Add index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON public.idempotency_log(expires_at);

-- Function to clean expired idempotency records
CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.idempotency_log WHERE expires_at < now();
$$;