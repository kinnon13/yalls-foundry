-- Force PostgREST schema cache reload
-- This ensures search_hybrid and match_rocker_memory_vec are available

-- Send reload notification (PostgREST listens to this)
NOTIFY pgrst, 'reload schema';

-- Verify functions exist and are accessible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'search_hybrid' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE EXCEPTION 'search_hybrid function not found!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'match_rocker_memory_vec'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE EXCEPTION 'match_rocker_memory_vec function not found!';
  END IF;
  
  RAISE NOTICE 'All search functions verified and schema cache notified for reload';
END $$;