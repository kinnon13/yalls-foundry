-- ============================================================================
-- BILLION-USER READINESS VERIFICATION
-- Run this to verify all infrastructure is properly configured
-- ============================================================================

\echo '🔍 Billion-User Readiness Check'
\echo '================================'
\echo ''

-- ============================================================================
-- 1. Idempotency Infrastructure
-- ============================================================================

\echo '1️⃣  Idempotency Index Status:'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Idempotency index exists'
    ELSE '❌ CRITICAL: Missing idempotency index'
  END AS status,
  COUNT(*) AS index_count
FROM pg_indexes
WHERE tablename = 'crm_events' 
  AND indexdef LIKE '%(props->>%idemKey%)%';

\echo ''

-- ============================================================================
-- 2. Partitioning Status
-- ============================================================================

\echo '2️⃣  Partition Status:'
SELECT 
  COUNT(*) AS partition_count,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ At least 6 months of partitions'
    WHEN COUNT(*) >= 2 THEN '⚠️  Only ' || COUNT(*) || ' partitions (recommend 6+)'
    ELSE '❌ CRITICAL: No partitions on crm_events_v2'
  END AS status
FROM pg_inherits
WHERE inhparent = 'public.crm_events_v2'::regclass;

\echo ''
\echo '   Partition Details:'
SELECT 
  inhrelid::regclass AS partition_name,
  pg_size_pretty(pg_total_relation_size(inhrelid)) AS size
FROM pg_inherits
WHERE inhparent = 'public.crm_events_v2'::regclass
ORDER BY inhrelid::text;

\echo ''

-- ============================================================================
-- 3. Automated Jobs Status
-- ============================================================================

\echo '3️⃣  Cron Jobs Status:'
SELECT 
  jobname,
  schedule,
  active,
  CASE 
    WHEN active THEN '✅ Active'
    ELSE '❌ Inactive'
  END AS status
FROM cron.job
WHERE jobname IN (
  'create-next-crm-partition',
  'drain-outbox',
  'outbox-retention',
  'cleanup-old-ai-logs',
  'cleanup-rate-limit-buckets',
  'refresh-business-metrics'
)
ORDER BY jobname;

\echo ''

-- ============================================================================
-- 4. Index Coverage
-- ============================================================================

\echo '4️⃣  Critical Index Coverage:'
WITH required_indexes AS (
  SELECT unnest(ARRAY[
    'idx_crm_events_idem_key',
    'idx_crm_events_tenant_ts',
    'idx_crm_contacts_tenant',
    'idx_ai_user_memory_user_namespace',
    'idx_conversation_messages_session_created',
    'idx_calendar_events_calendar_time',
    'idx_marketplace_listings_active'
  ]) AS index_name
)
SELECT 
  ri.index_name,
  CASE 
    WHEN i.indexname IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END AS status
FROM required_indexes ri
LEFT JOIN pg_indexes i ON i.indexname = ri.index_name
ORDER BY ri.index_name;

\echo ''

-- ============================================================================
-- 5. RLS Security Audit
-- ============================================================================

\echo '5️⃣  RLS Policy Coverage:'
WITH critical_tables AS (
  SELECT unnest(ARRAY[
    'crm_events',
    'crm_events_v2',
    'crm_contacts',
    'contact_identities',
    'outbox',
    'ai_user_memory',
    'ai_user_consent',
    'ops_audit_runs',
    'db_health_snapshots'
  ]) AS table_name
)
SELECT 
  ct.table_name,
  COALESCE(t.rowsecurity, false) AS rls_enabled,
  COUNT(p.policyname) AS policy_count,
  CASE 
    WHEN COALESCE(t.rowsecurity, false) AND COUNT(p.policyname) > 0 
      THEN '✅ Protected'
    WHEN COALESCE(t.rowsecurity, false) AND COUNT(p.policyname) = 0
      THEN '⚠️  RLS enabled but no policies'
    ELSE '❌ CRITICAL: No RLS'
  END AS security_status
FROM critical_tables ct
LEFT JOIN pg_tables t ON t.tablename = ct.table_name AND t.schemaname = 'public'
LEFT JOIN pg_policies p ON p.tablename = ct.table_name AND p.schemaname = 'public'
GROUP BY ct.table_name, t.rowsecurity
ORDER BY ct.table_name;

\echo ''

-- ============================================================================
-- 6. Function Permissions
-- ============================================================================

\echo '6️⃣  Database Function Security:'
SELECT 
  p.proname AS function_name,
  CASE 
    WHEN p.proname = 'ingest_event' AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
      THEN '✅ Correct (authenticated can execute)'
    WHEN p.proname IN ('resolve_contact', 'outbox_claim', 'outbox_mark_delivered') 
         AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
         AND has_function_privilege('service_role', p.oid, 'EXECUTE')
      THEN '✅ Correct (service_role only)'
    ELSE '⚠️  Review permissions'
  END AS permission_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'app' 
  AND p.proname IN ('ingest_event', 'resolve_contact', 'outbox_claim', 'outbox_mark_delivered')
ORDER BY p.proname;

\echo ''

-- ============================================================================
-- 7. System Health Metrics
-- ============================================================================

\echo '7️⃣  Current System Health:'
SELECT 
  pg_size_pretty(pg_database_size(current_database())) AS database_size,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') AS active_connections,
  (SELECT count(*) FROM pg_stat_activity) AS total_connections,
  (SELECT count(*) FROM outbox WHERE delivered_at IS NULL) AS outbox_pending,
  CASE 
    WHEN (SELECT count(*) FROM outbox WHERE delivered_at IS NULL) < 100 THEN '✅ Healthy'
    WHEN (SELECT count(*) FROM outbox WHERE delivered_at IS NULL) < 1000 THEN '⚠️  Backlog building'
    ELSE '❌ CRITICAL: Outbox backlog'
  END AS outbox_status,
  round(
    (SELECT sum(blks_hit)::numeric / NULLIF(sum(blks_hit + blks_read), 0) * 100)
    FROM pg_stat_database 
    WHERE datname = current_database()
  , 2) AS cache_hit_ratio_pct;

\echo ''

-- ============================================================================
-- 8. Dual-Write Status
-- ============================================================================

\echo '8️⃣  Dual-Write Migration Status:'
SELECT 
  (SELECT count(*) FROM crm_events) AS v1_count,
  (SELECT count(*) FROM crm_events_v2) AS v2_count,
  (SELECT count(*) FROM crm_events) - (SELECT count(*) FROM crm_events_v2) AS remaining_delta,
  CASE 
    WHEN (SELECT count(*) FROM crm_events) = (SELECT count(*) FROM crm_events_v2) 
      THEN '✅ Fully synced'
    WHEN (SELECT count(*) FROM crm_events) - (SELECT count(*) FROM crm_events_v2) < 1000
      THEN '⚠️  Nearly synced (' || ((SELECT count(*) FROM crm_events) - (SELECT count(*) FROM crm_events_v2))::text || ' remaining)'
    ELSE '❌ Sync in progress'
  END AS sync_status;

\echo ''

-- ============================================================================
-- 9. Performance Indicators
-- ============================================================================

\echo '9️⃣  Performance Indicators:'
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size,
  CASE 
    WHEN pg_total_relation_size(schemaname||'.'||tablename) > 10737418240 
      THEN '⚠️  Large (>10GB)'
    ELSE '✅ Manageable'
  END AS size_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('crm_events', 'crm_events_v2', 'crm_contacts', 'ai_user_memory')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

\echo ''

-- ============================================================================
-- 10. Overall Readiness Score
-- ============================================================================

\echo '🎯 OVERALL READINESS SCORE:'
WITH checks AS (
  SELECT 
    -- Idempotency index
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'crm_events' AND indexdef LIKE '%(props->>%idemKey%)%'
    ) THEN 1 ELSE 0 END AS has_idem_index,
    
    -- Partitions
    CASE WHEN (
      SELECT count(*) FROM pg_inherits WHERE inhparent = 'public.crm_events_v2'::regclass
    ) >= 2 THEN 1 ELSE 0 END AS has_partitions,
    
    -- Cron jobs
    CASE WHEN (
      SELECT count(*) FROM cron.job WHERE active = true
    ) >= 3 THEN 1 ELSE 0 END AS has_cron,
    
    -- RLS policies
    CASE WHEN (
      SELECT count(*) 
      FROM pg_tables t
      WHERE t.schemaname = 'public' 
        AND t.tablename IN ('crm_events', 'crm_contacts', 'outbox')
        AND t.rowsecurity = true
    ) = 3 THEN 1 ELSE 0 END AS has_rls,
    
    -- Outbox health
    CASE WHEN (
      SELECT count(*) FROM outbox WHERE delivered_at IS NULL
    ) < 100 THEN 1 ELSE 0 END AS outbox_healthy,
    
    -- Cache hit ratio
    CASE WHEN (
      SELECT round(sum(blks_hit)::numeric / NULLIF(sum(blks_hit + blks_read), 0) * 100)
      FROM pg_stat_database WHERE datname = current_database()
    ) > 95 THEN 1 ELSE 0 END AS cache_healthy
)
SELECT 
  (has_idem_index + has_partitions + has_cron + has_rls + outbox_healthy + cache_healthy) AS score,
  CASE 
    WHEN (has_idem_index + has_partitions + has_cron + has_rls + outbox_healthy + cache_healthy) = 6
      THEN '✅ BILLION-USER READY'
    WHEN (has_idem_index + has_partitions + has_cron + has_rls + outbox_healthy + cache_healthy) >= 4
      THEN '⚠️  MOSTLY READY - Address warnings above'
    ELSE '❌ NOT READY - Critical issues must be fixed'
  END AS readiness_status
FROM checks;

\echo ''
\echo '================================'
\echo '✅ Verification Complete'
\echo '================================'
