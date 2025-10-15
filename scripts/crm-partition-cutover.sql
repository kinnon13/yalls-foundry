-- CRM Events Partition Cutover Script
-- Run verifications first, then backfill, then cutover during low-traffic window

-- ============================================================================
-- PART 1: VERIFICATION (run immediately, safe to repeat)
-- ============================================================================

\echo '1. Checking dual-write trigger...'
SELECT 
  CASE 
    WHEN COUNT(*) = 1 AND bool_and(tgenabled = 'O') THEN '✅ Trigger active'
    WHEN COUNT(*) = 0 THEN '❌ Trigger missing - migration not applied?'
    ELSE '⚠️  Trigger disabled'
  END AS trigger_status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'crm_events' AND tgname = 'mirror_to_v2';

\echo '2. Checking partitions...'
SELECT 
  inhrelid::regclass AS partition,
  pg_get_expr(c.relpartbound, c.oid) AS bounds
FROM pg_inherits i
JOIN pg_class c ON c.oid = i.inhrelid
WHERE i.inhparent = 'public.crm_events_v2'::regclass
ORDER BY partition;

\echo '3. Checking RLS policies...'
SELECT 
  CASE 
    WHEN relrowsecurity THEN '✅ RLS enabled on crm_events_v2'
    ELSE '❌ RLS not enabled!'
  END AS rls_status
FROM pg_class 
WHERE relname='crm_events_v2';

SELECT 
  polname,
  pg_get_expr(polqual, polrelid) AS using_clause,
  pg_get_expr(polwithcheck, polrelid) AS with_check
FROM pg_policy 
WHERE polrelid='public.crm_events_v2'::regclass;

\echo '4. Checking indexes...'
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname='public'
  AND tablename='crm_events_v2'
ORDER BY indexname;

\echo '5. Smoke test (mirror works)...'
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
  test_tenant uuid := gen_random_uuid();
  test_ts timestamptz := now();
  found_count int;
BEGIN
  -- Insert into v1 (should trigger mirror)
  INSERT INTO public.crm_events (id, tenant_id, type, props, ts, source)
  VALUES (test_id, test_tenant, 'smoke.test', '{"foo":"bar"}', test_ts, 'web');
  
  -- Check if mirrored to v2
  SELECT COUNT(*) INTO found_count
  FROM public.crm_events_v2
  WHERE id = test_id AND ts = test_ts;
  
  IF found_count = 1 THEN
    RAISE NOTICE '✅ Mirror working: found test row in v2';
  ELSE
    RAISE WARNING '❌ Mirror failed: test row not in v2';
  END IF;
  
  -- Cleanup
  DELETE FROM public.crm_events WHERE id = test_id;
  DELETE FROM public.crm_events_v2 WHERE id = test_id;
END $$;

\echo '6. Checking data counts...'
SELECT 
  (SELECT COUNT(*) FROM public.crm_events) AS v1_count,
  (SELECT COUNT(*) FROM public.crm_events_v2) AS v2_count,
  (SELECT COUNT(*) FROM public.crm_events) - (SELECT COUNT(*) FROM public.crm_events_v2) AS remaining;

-- ============================================================================
-- PART 2: BACKFILL (repeat until remaining=0, safe to run multiple times)
-- ============================================================================

\echo 'Starting backfill (100k rows)...'
INSERT INTO public.crm_events_v2 (id, tenant_id, type, props, contact_id, contact_hint, anonymous_id, source, ts, created_at)
SELECT id, tenant_id, type, props, contact_id, contact_hint, anonymous_id, source, ts, created_at
FROM public.crm_events
WHERE ts < now() - interval '5 minutes'
ORDER BY ts
LIMIT 100000
ON CONFLICT (id, ts) DO NOTHING;

\echo 'Backfill progress:'
SELECT 
  (SELECT COUNT(*) FROM public.crm_events) AS total_v1,
  (SELECT COUNT(*) FROM public.crm_events_v2) AS total_v2,
  (SELECT COUNT(*) FROM public.crm_events) - (SELECT COUNT(*) FROM public.crm_events_v2) AS remaining,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.crm_events) = (SELECT COUNT(*) FROM public.crm_events_v2) 
    THEN '✅ READY FOR CUTOVER'
    ELSE '⏳ Run backfill again'
  END AS status;

-- ============================================================================
-- PART 3: CUTOVER (run during low-traffic window, ONE TIME ONLY)
-- ============================================================================
-- Uncomment the block below when ready to cutover

/*
BEGIN;

\echo 'Ensuring next month partition exists...'
SELECT app.ensure_next_crm_partition();

\echo 'Locking crm_events table...'
LOCK TABLE public.crm_events IN ACCESS EXCLUSIVE MODE;

\echo 'Dropping dual-write trigger...'
DROP TRIGGER IF EXISTS mirror_to_v2 ON public.crm_events;

\echo 'Final delta sync (catching last 5 min)...'
INSERT INTO public.crm_events_v2 (id, tenant_id, type, props, contact_id, contact_hint, anonymous_id, source, ts, created_at)
SELECT s.id, s.tenant_id, s.type, s.props, s.contact_id, s.contact_hint, s.anonymous_id, s.source, s.ts, s.created_at
FROM public.crm_events s
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_events_v2 d
  WHERE d.id = s.id AND d.ts = s.ts
);

\echo 'Swapping tables...'
ALTER TABLE public.crm_events RENAME TO crm_events_old;
ALTER TABLE public.crm_events_v2 RENAME TO crm_events;

\echo 'Verifying final counts...'
SELECT 
  (SELECT COUNT(*) FROM public.crm_events) AS new_count,
  (SELECT COUNT(*) FROM public.crm_events_old) AS old_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.crm_events) = (SELECT COUNT(*) FROM public.crm_events_old)
    THEN '✅ Counts match!'
    ELSE '⚠️  Count mismatch - investigate before dropping old table'
  END AS verification;

COMMIT;

\echo '✅ CUTOVER COMPLETE'
\echo 'Next steps:'
\echo '1. Test app writes/reads for 24h'
\echo '2. Monitor partition growth'
\echo '3. After validation: DROP TABLE public.crm_events_old;'
*/

-- ============================================================================
-- MONITORING QUERIES (run periodically post-cutover)
-- ============================================================================

-- Check partition sizes
-- SELECT 
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
--   pg_total_relation_size(schemaname||'.'||tablename) AS bytes
-- FROM pg_tables
-- WHERE tablename LIKE 'crm_events_%'
-- ORDER BY bytes DESC;

-- Check recent insert rate
-- SELECT 
--   date_trunc('hour', ts) AS hour,
--   COUNT(*) AS inserts
-- FROM public.crm_events
-- WHERE ts > now() - interval '24 hours'
-- GROUP BY 1
-- ORDER BY 1 DESC
-- LIMIT 24;
