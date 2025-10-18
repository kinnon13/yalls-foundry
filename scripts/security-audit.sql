-- Security Audit SQL
-- Run this to verify RLS and SECURITY DEFINER policies are correct

-- ============================================
-- 1. Check for tables without RLS enabled
-- ============================================
SELECT 'FAIL: Tables without RLS' as audit_check,
       n.nspname as schema_name, 
       c.relname as table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r' 
  AND c.relrowsecurity = false
  AND c.relname NOT IN (
    -- Allowlist: tables that are intentionally public
    'billing_plans',
    'time_windows'
  );

-- ============================================
-- 2. Check SECURITY DEFINER functions have proper search_path
-- ============================================
SELECT 'FAIL: SECURITY DEFINER without search_path=public' as audit_check,
       n.nspname as schema_name,
       p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosecdef = true
  AND n.nspname = 'public'
  AND NOT EXISTS (
    SELECT 1 
    FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
    WHERE cfg LIKE '%search_path%public%'
  );

-- ============================================
-- 3. Check for policies using NOT on jsonb
-- ============================================
SELECT 'WARN: Policy may use NOT on jsonb' as audit_check,
       c.relname as table_name,
       pol.polname as policy_name,
       pg_get_expr(pol.polqual, pol.polrelid) as using_expression
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
WHERE pg_get_expr(pol.polqual, pol.polrelid) ~* 'NOT\s+\([^)]*->([>"])?\s*''[^'']+'''
   OR pg_get_expr(pol.polwithcheck, pol.polrelid) ~* 'NOT\s+\([^)]*->([>"])?\s*''[^'']+''';

-- ============================================
-- 4. Check for functions using NOT on jsonb
-- ============================================
SELECT 'WARN: Function may use NOT on jsonb' as audit_check,
       n.nspname as schema_name,
       p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ~* 'NOT\s+\([^)]*->([>"])?'
  AND pg_get_functiondef(p.oid) !~* '::boolean';

-- ============================================
-- 5. Summary: Count issues
-- ============================================
SELECT 
  'Summary' as audit_check,
  COUNT(*) FILTER (WHERE c.relrowsecurity = false) as tables_without_rls,
  COUNT(DISTINCT p.proname) FILTER (WHERE p.prosecdef = true) as security_definer_functions
FROM pg_class c
CROSS JOIN pg_proc p
CROSS JOIN pg_namespace n
WHERE c.relkind = 'r' 
  AND n.nspname = 'public'
  AND c.relnamespace = n.oid;
