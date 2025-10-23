-- Fix remaining SECURITY DEFINER functions (excluding extension functions)

DO $$
DECLARE
  func_record RECORD;
  func_def TEXT;
  func_signature TEXT;
BEGIN
  FOR func_record IN 
    SELECT n.nspname as schema_name,
           p.proname as function_name,
           pg_get_function_identity_arguments(p.oid) as args,
           pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
    WHERE p.prosecdef = true
      AND n.nspname = 'public'
      AND d.objid IS NULL  -- Exclude extension functions
      AND NOT EXISTS (
        SELECT 1 
        FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
        WHERE cfg LIKE '%search_path%public%'
      )
  LOOP
    func_def := func_record.definition;
    func_signature := func_record.schema_name || '.' || func_record.function_name || '(' || func_record.args || ')';
    
    -- Add SET search_path = public
    func_def := regexp_replace(
      func_def,
      '(LANGUAGE \w+)',
      '\1 SET search_path = public',
      'g'
    );
    
    -- Drop and recreate
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_signature || ' CASCADE';
    EXECUTE func_def;
    
    RAISE NOTICE 'Fixed: %', func_signature;
  END LOOP;
END $$;

-- Final count of vulnerable user-defined functions
SELECT 
  COUNT(*) as remaining_vulnerable_user_functions
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
WHERE p.prosecdef = true
  AND n.nspname = 'public'
  AND d.objid IS NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
    WHERE cfg LIKE '%search_path%public%'
  );