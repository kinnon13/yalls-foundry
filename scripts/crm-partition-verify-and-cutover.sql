-- ========================================
-- CRM Events V2 Verification & Cutover
-- Run sections sequentially in Supabase SQL Editor
-- ========================================

-- ========================================
-- SECTION 1: PRE-FLIGHT VERIFICATION
-- ========================================

\echo '=== 1. Checking dual-write trigger ==='
SELECT tgname, 
       CASE tgenabled 
         WHEN 'O' THEN 'ENABLED' 
         WHEN 'D' THEN 'DISABLED' 
         ELSE 'UNKNOWN' 
       END AS status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'crm_events' AND tgname = 'mirror_to_v2';
-- Expected: mirror_to_v2 | ENABLED

\echo '=== 2. Checking v2 partitions ==='
SELECT inhrelid::regclass AS partition, 
       pg_get_expr(c.relpartbound, c.oid) AS bounds,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS size
FROM pg_inherits i
JOIN pg_class c ON c.oid = i.inhrelid
WHERE i.inhparent = 'public.crm_events_v2'::regclass
ORDER BY partition;
-- Expected: At least current + next month partitions

\echo '=== 3. Checking RLS on v2 ==='
SELECT relname, relrowsecurity AS rls_enabled
FROM pg_class 
WHERE relname = 'crm_events_v2';
-- Expected: rls_enabled = true

\echo '=== 4. Checking v2 policies ==='
SELECT polname, 
       pg_get_expr(polqual, polrelid) AS using_clause,
       pg_get_expr(polwithcheck, polrelid) AS with_check_clause
FROM pg_policy 
WHERE polrelid = 'public.crm_events_v2'::regclass
ORDER BY polname;
-- Expected: Policies matching v1

\echo '=== 5. Checking v2 indexes ==='
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'crm_events_v2'
ORDER BY indexname;
-- Expected: PK (id, ts), (tenant_id, ts), (tenant_id, type, ts), 
--           (tenant_id, contact_id, ts), idemKey partial index

\echo '=== 6. Row count comparison ==='
SELECT 
  (SELECT COUNT(*) FROM public.crm_events) AS v1_count,
  (SELECT COUNT(*) FROM public.crm_events_v2) AS v2_count,
  (SELECT COUNT(*) FROM public.crm_events) - (SELECT COUNT(*) FROM public.crm_events_v2) AS remaining;

\echo '=== 7. Smoke test (mirror verification) ==='
DO $$
DECLARE
  test_id UUID;
  test_ts TIMESTAMPTZ;
  found_in_v2 BOOLEAN;
BEGIN
  -- Insert test row
  INSERT INTO public.crm_events (id, tenant_id, type, props, ts, source)
  VALUES (gen_random_uuid(), gen_random_uuid(), 'smoke.test', '{"test":"verification"}', now(), 'web')
  RETURNING id, ts INTO test_id, test_ts;
  
  -- Check if mirrored to v2
  SELECT EXISTS(
    SELECT 1 FROM public.crm_events_v2
    WHERE id = test_id AND ts = test_ts
  ) INTO found_in_v2;
  
  -- Cleanup
  DELETE FROM public.crm_events WHERE id = test_id;
  DELETE FROM public.crm_events_v2 WHERE id = test_id;
  
  IF found_in_v2 THEN
    RAISE NOTICE '✅ Smoke test PASSED - dual-write working';
  ELSE
    RAISE EXCEPTION '❌ Smoke test FAILED - row not mirrored to v2';
  END IF;
END $$;

-- ========================================
-- SECTION 2: BACKFILL (Run multiple times until remaining = 0)
-- ========================================

\echo '=== Backfilling v1 to v2 (100K batch) ==='
INSERT INTO public.crm_events_v2 (
  id, tenant_id, type, props, contact_id, contact_hint, 
  anonymous_id, source, ts, created_at
)
SELECT 
  id, tenant_id, type, props, contact_id, contact_hint,
  anonymous_id, source, ts, created_at
FROM public.crm_events
WHERE ts < now() - interval '5 minutes'
ORDER BY ts
LIMIT 100000
ON CONFLICT (id, ts) DO NOTHING;

\echo '=== Progress check ==='
SELECT 
  (SELECT COUNT(*) FROM public.crm_events) AS v1_total,
  (SELECT COUNT(*) FROM public.crm_events_v2) AS v2_total,
  (SELECT COUNT(*) FROM public.crm_events) - (SELECT COUNT(*) FROM public.crm_events_v2) AS remaining,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.crm_events) = (SELECT COUNT(*) FROM public.crm_events_v2) 
    THEN '✅ READY FOR CUTOVER'
    ELSE '⏳ Run backfill again'
  END AS status;

-- ========================================
-- SECTION 3: CUTOVER (Run during low-traffic window)
-- ========================================

-- STOP! Before running this:
-- 1. Ensure remaining = 0 from previous section
-- 2. Schedule during low-traffic window
-- 3. Have rollback plan ready
-- 4. Take DB snapshot/backup

\echo '=== CUTOVER: Swapping v1 → v2 ==='
BEGIN;

-- Ensure next month partition exists
SELECT app.ensure_next_crm_partition();

-- Lock v1 to prevent writes
LOCK TABLE public.crm_events IN ACCESS EXCLUSIVE MODE;

-- Drop trigger (no longer needed after rename)
DROP TRIGGER IF EXISTS mirror_to_v2 ON public.crm_events;

-- Catch any final stragglers
INSERT INTO public.crm_events_v2 (
  id, tenant_id, type, props, contact_id, contact_hint,
  anonymous_id, source, ts, created_at
)
SELECT 
  s.id, s.tenant_id, s.type, s.props, s.contact_id, s.contact_hint,
  s.anonymous_id, s.source, s.ts, s.created_at
FROM public.crm_events s
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_events_v2 d
  WHERE d.id = s.id AND d.ts = s.ts
);

-- Atomic swap
ALTER TABLE public.crm_events RENAME TO crm_events_old;
ALTER TABLE public.crm_events_v2 RENAME TO crm_events;

-- Sanity check
SELECT 
  (SELECT COUNT(*) FROM public.crm_events) AS new_crm_events,
  (SELECT COUNT(*) FROM public.crm_events_old) AS old_crm_events,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.crm_events) = (SELECT COUNT(*) FROM public.crm_events_old)
    THEN '✅ Row counts match'
    ELSE '⚠️ Row count mismatch - INVESTIGATE'
  END AS validation;

COMMIT;

\echo '=== ✅ CUTOVER COMPLETE ==='

-- ========================================
-- SECTION 4: POST-CUTOVER VERIFICATION
-- ========================================

\echo '=== Post-cutover checks ==='

-- 1. Table structure
SELECT schemaname, tablename, 
       CASE WHEN relrowsecurity THEN '✅ RLS enabled' ELSE '❌ RLS disabled' END AS rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
  AND tablename IN ('crm_events', 'crm_events_old')
ORDER BY tablename;

-- 2. Indexes still present
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'crm_events'
ORDER BY indexname;

-- 3. Trigger cleanup (should be gone)
SELECT tgname
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname IN ('crm_events', 'crm_events_old')
  AND tgname LIKE '%mirror%';
-- Expected: 0 rows

-- 4. Active partitions
SELECT inhrelid::regclass AS partition,
       pg_size_pretty(pg_total_relation_size(inhrelid)) AS size
FROM pg_inherits
WHERE inhparent = 'public.crm_events'::regclass
ORDER BY partition;

-- 5. Test insert via app.ingest_event
SELECT app.ingest_event(
  gen_random_uuid(), -- tenant_id
  'cutover.test',    -- event_type
  '{"verified": true, "timestamp": "' || now()::text || '"}'::jsonb,
  NULL,              -- contact_id
  NULL,              -- anonymous_id
  'verification'     -- source
);

-- 6. Verify the test event landed in partitioned table
SELECT COUNT(*) AS test_events
FROM public.crm_events
WHERE type = 'cutover.test'
  AND ts > now() - interval '1 minute';
-- Expected: >= 1

-- Cleanup test events
DELETE FROM public.crm_events WHERE type = 'cutover.test';

-- ========================================
-- SECTION 5: MONITORING QUERIES (Run periodically for 24h)
-- ========================================

\echo '=== Monitoring queries ==='

-- Partition growth (current month should grow)
SELECT inhrelid::regclass AS partition,
       pg_size_pretty(pg_total_relation_size(inhrelid)) AS size,
       (SELECT COUNT(*) FROM ONLY public.crm_events WHERE tableoid = inhrelid) AS row_count
FROM pg_inherits
WHERE inhparent = 'public.crm_events'::regclass
ORDER BY partition DESC
LIMIT 2;

-- Recent insert performance (should be < 50ms p95)
SELECT 
  type,
  COUNT(*) AS events,
  EXTRACT(EPOCH FROM (MAX(ts) - MIN(ts))) AS time_span_sec
FROM public.crm_events
WHERE ts > now() - interval '5 minutes'
GROUP BY type
ORDER BY events DESC
LIMIT 10;

-- Outbox health (should be processing normally)
SELECT 
  COUNT(*) FILTER (WHERE delivered_at IS NULL) AS pending,
  COUNT(*) FILTER (WHERE delivered_at IS NOT NULL AND delivered_at > now() - interval '1 hour') AS delivered_last_hour,
  CASE 
    WHEN COUNT(*) FILTER (WHERE delivered_at IS NULL) < 1000 THEN '✅ Healthy'
    ELSE '⚠️ Backlog building'
  END AS status
FROM public.outbox;

-- ========================================
-- OPTIONAL: CLEANUP OLD TABLE (Run after 7+ days of stable operation)
-- ========================================

-- STOP! Only run this after:
-- 1. 7+ days of stable operation
-- 2. All backups confirmed working
-- 3. No rollback needed

-- DROP TABLE public.crm_events_old;
-- \echo '=== Old table dropped ==='
