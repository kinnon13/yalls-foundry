-- Fix SECURITY DEFINER function missing search_path
-- This prevents potential SQL injection attacks

CREATE OR REPLACE FUNCTION public._log_rpc(
  p_rpc_name text, 
  p_duration_ms int, 
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public  -- Add explicit search_path for security
AS $$
BEGIN
  INSERT INTO public.rpc_metrics(rpc_name, duration_ms, error, created_at)
  VALUES (p_rpc_name, p_duration_ms, p_error, now());
EXCEPTION WHEN OTHERS THEN
  -- Fail silently to avoid breaking RPC calls
  NULL;
END $$;

-- Verify all custom SECURITY DEFINER functions have search_path
-- (PostGIS functions like st_* are system-level and exempt)
DO $$
DECLARE
  missing_funcs text[];
BEGIN
  SELECT array_agg(p.proname)
  INTO missing_funcs
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prosecdef = true
    AND n.nspname = 'public'
    AND p.proname NOT LIKE 'st_%'
    AND NOT EXISTS (
      SELECT 1 
      FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
      WHERE cfg LIKE '%search_path%'
    );

  IF missing_funcs IS NOT NULL AND array_length(missing_funcs, 1) > 0 THEN
    RAISE WARNING 'SECURITY DEFINER functions missing search_path: %', missing_funcs;
  END IF;
END $$;