-- Phase 2 Database Verification
-- Run via: psql <connection-string> -f scripts/verify-db.sql

\echo '🗄️  Phase 2 Database Verification'
\echo '=================================='
\echo ''

-- 1. Check critical functions exist
\echo '1️⃣  Checking database functions...'
SELECT 
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ All 5 critical functions exist'
    ELSE '❌ Missing functions: ' || (5 - COUNT(*)::text)
  END AS function_check,
  array_agg(proname ORDER BY proname) AS found_functions
FROM pg_proc 
WHERE proname IN (
  'ingest_event',
  'resolve_contact', 
  'outbox_claim',
  'outbox_mark_delivered',
  'ensure_next_crm_partition'
)
AND pronamespace = 'app'::regnamespace;

\echo ''

-- 2. Check partitioned table structure
\echo '2️⃣  Checking CRM events partitioning...'
SELECT 
  CASE 
    WHEN relkind = 'p' THEN '✅ crm_events is partitioned'
    ELSE '❌ crm_events is NOT partitioned'
  END AS partition_status
FROM pg_class 
WHERE relname = 'crm_events' 
  AND relnamespace = 'public'::regnamespace;

\echo ''
\echo '   Current partitions:'
SELECT 
  inhrelid::regclass AS partition_name,
  pg_get_expr(c.relpartbound, c.oid) AS partition_bounds,
  pg_size_pretty(pg_total_relation_size(inhrelid)) AS size
FROM pg_inherits i
JOIN pg_class c ON c.oid = i.inhrelid
WHERE i.inhparent = 'public.crm_events'::regclass
ORDER BY partition_name;

\echo ''

-- 3. Check indexes on partitioned table
\echo '3️⃣  Checking indexes...'
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'crm_events'
ORDER BY indexname;

\echo ''

-- 4. Check RLS policies
\echo '4️⃣  Checking Row Level Security...'
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS enabled'
    ELSE '❌ RLS disabled'
  END AS rls_status
FROM pg_tables
WHERE tablename IN ('crm_events', 'crm_contacts', 'outbox')
ORDER BY tablename;

\echo ''

-- 5. Check contacts table has deduplication index
\echo '5️⃣  Checking contact deduplication index...'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Unique index exists on crm_contacts'
    ELSE '❌ Missing unique constraint on identities'
  END AS dedup_check
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'crm_contacts'
  AND indexname LIKE '%unique%';

\echo ''

-- 6. Test partition helper function
\echo '6️⃣  Testing partition creation...'
SELECT app.ensure_next_crm_partition();

SELECT 
  COUNT(*) AS partition_count,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ At least 2 months of partitions'
    ELSE '⚠️  Only 1 partition (run ensure_next_crm_partition)'
  END AS partition_coverage
FROM pg_inherits
WHERE inhparent = 'public.crm_events'::regclass;

\echo ''

-- 7. Check outbox table structure
\echo '7️⃣  Checking outbox pattern...'
SELECT 
  COUNT(*) AS total_messages,
  COUNT(*) FILTER (WHERE delivered_at IS NULL) AS pending,
  COUNT(*) FILTER (WHERE delivered_at IS NOT NULL) AS delivered,
  COUNT(*) FILTER (WHERE claimed_by IS NOT NULL AND delivered_at IS NULL) AS in_flight
FROM outbox;

\echo ''

-- 8. Data integrity check
\echo '8️⃣  Checking data integrity...'
SELECT 
  'crm_events' AS table_name,
  COUNT(*) AS row_count,
  COUNT(DISTINCT tenant_id) AS unique_tenants,
  MIN(ts) AS earliest_event,
  MAX(ts) AS latest_event
FROM crm_events
UNION ALL
SELECT 
  'crm_contacts',
  COUNT(*),
  COUNT(DISTINCT tenant_id),
  MIN(created_at),
  MAX(created_at)
FROM crm_contacts;

\echo ''
\echo '=================================='
\echo '✅ Database verification complete'
\echo '=================================='
