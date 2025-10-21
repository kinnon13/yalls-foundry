-- RLS Verification Script
-- Run this to verify all tables have RLS enabled and proper policies

-- ============================================
-- 1. Tables without RLS (should be empty)
-- ============================================
SELECT 
  'FAIL: Tables without RLS' as audit_check,
  n.nspname as schema_name, 
  c.relname as table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r' 
  AND c.relrowsecurity = false
  AND c.relname IN (
    'rocker_threads',
    'rocker_messages',
    'rocker_files',
    'rocker_tasks',
    'rocker_long_memory',
    'rocker_knowledge',
    'knowledge_chunks',
    'knowledge_items',
    'voice_events',
    'feature_flags',
    'user_roles',
    'account_capabilities',
    'profiles',
    'andy_prediction_sessions',
    'andy_prediction_rounds'
  );

-- ============================================
-- 2. Show all policies (verify coverage)
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN qual IS NULL THEN '(none)'
    ELSE left(qual, 100)
  END as using_expression,
  CASE 
    WHEN with_check IS NULL THEN '(none)'
    ELSE left(with_check, 100)
  END as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'rocker_threads',
    'rocker_messages',
    'rocker_files',
    'rocker_tasks',
    'rocker_long_memory',
    'knowledge_chunks',
    'voice_events',
    'feature_flags'
  )
ORDER BY tablename, cmd;

-- ============================================
-- 3. Check for missing CRUD policies
-- ============================================
WITH required_tables AS (
  SELECT unnest(ARRAY[
    'rocker_threads',
    'rocker_messages',
    'rocker_files',
    'rocker_tasks',
    'rocker_long_memory',
    'knowledge_chunks'
  ]) as table_name
),
required_commands AS (
  SELECT unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as cmd
),
policy_coverage AS (
  SELECT 
    r.table_name,
    c.cmd,
    COUNT(p.policyname) as policy_count
  FROM required_tables r
  CROSS JOIN required_commands c
  LEFT JOIN pg_policies p 
    ON p.tablename = r.table_name 
    AND p.cmd = c.cmd
  GROUP BY r.table_name, c.cmd
)
SELECT 
  'WARN: Missing policy' as audit_check,
  table_name,
  cmd as operation,
  policy_count
FROM policy_coverage
WHERE policy_count = 0
ORDER BY table_name, cmd;

-- ============================================
-- 4. Feature flags security check
-- ============================================
SELECT 
  'Feature flag UPDATE policy' as check_type,
  policyname,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'feature_flags'
  AND cmd = 'UPDATE';

-- ============================================
-- 5. Voice events admin-only SELECT
-- ============================================
SELECT 
  'Voice events SELECT policy' as check_type,
  policyname,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'voice_events'
  AND cmd = 'SELECT';

-- ============================================
-- 6. Summary
-- ============================================
SELECT 
  'Summary' as audit_check,
  COUNT(*) FILTER (WHERE c.relrowsecurity = false) as tables_without_rls,
  COUNT(DISTINCT p.tablename) as tables_with_policies,
  COUNT(p.policyname) as total_policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.tablename = c.relname
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND c.relname IN (
    'rocker_threads',
    'rocker_messages',
    'rocker_files',
    'rocker_tasks',
    'rocker_long_memory',
    'knowledge_chunks',
    'voice_events',
    'feature_flags'
  );
