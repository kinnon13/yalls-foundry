-- CRM Idempotency & Deduplication Test
-- Tests the core CRM ingest pattern with idempotency keys

\echo '🧪 Testing CRM Ingest Idempotency'
\echo '================================='
\echo ''

-- Setup test business/tenant
DO $$
DECLARE
  test_tenant_id uuid := gen_random_uuid();
  test_business_id uuid := gen_random_uuid();
  test_idem_key text := 'test-' || gen_random_uuid()::text;
  result1 jsonb;
  result2 jsonb;
  contact_count int;
BEGIN
  \echo '1️⃣  First ingest (should create contact)...'
  
  -- First call - should create contact
  SELECT app.ingest_event(
    test_business_id,
    'signup',
    '{"plan":"pro","source":"web"}'::jsonb,
    '{"email":"test@example.com","externalId":"acct_123"}'::jsonb,
    test_idem_key
  ) INTO result1;
  
  RAISE NOTICE 'First call result: %', result1;
  
  IF (result1->>'idempotent')::boolean = false THEN
    RAISE NOTICE '✅ First call created new event';
  ELSE
    RAISE WARNING '❌ First call marked as idempotent (unexpected)';
  END IF;
  
  \echo ''
  \echo '2️⃣  Second ingest (same idem key - should be idempotent)...'
  
  -- Second call with same idem key - should be idempotent
  SELECT app.ingest_event(
    test_business_id,
    'signup',
    '{"plan":"pro","source":"web"}'::jsonb,
    '{"email":"test@example.com","externalId":"acct_123"}'::jsonb,
    test_idem_key
  ) INTO result2;
  
  RAISE NOTICE 'Second call result: %', result2;
  
  IF (result2->>'idempotent')::boolean = true THEN
    RAISE NOTICE '✅ Second call was idempotent (correct)';
  ELSE
    RAISE WARNING '❌ Second call created duplicate event (bug!)';
  END IF;
  
  \echo ''
  \echo '3️⃣  Checking contact deduplication...'
  
  -- Verify only ONE contact created despite two calls
  SELECT COUNT(*) INTO contact_count
  FROM crm_contacts
  WHERE tenant_id = test_tenant_id;
  
  IF contact_count = 1 THEN
    RAISE NOTICE '✅ Only 1 contact created (deduplication worked)';
  ELSE
    RAISE WARNING '❌ Found % contacts (should be 1)', contact_count;
  END IF;
  
  \echo ''
  \echo '4️⃣  Testing different identity types...'
  
  -- Test email-based identity
  SELECT app.ingest_event(
    test_business_id,
    'login',
    '{}'::jsonb,
    '{"email":"test@example.com"}'::jsonb,
    NULL
  );
  
  -- Test externalId-based identity
  SELECT app.ingest_event(
    test_business_id,
    'purchase',
    '{"amount":99}'::jsonb,
    '{"externalId":"acct_123"}'::jsonb,
    NULL
  );
  
  -- Both should resolve to same contact
  SELECT COUNT(DISTINCT id) INTO contact_count
  FROM crm_contacts
  WHERE tenant_id = test_tenant_id;
  
  IF contact_count = 1 THEN
    RAISE NOTICE '✅ Multiple identities resolve to same contact';
  ELSE
    RAISE WARNING '❌ Created % contacts instead of 1', contact_count;
  END IF;
  
  \echo ''
  \echo '5️⃣  Cleanup test data...'
  
  DELETE FROM crm_events WHERE tenant_id = test_tenant_id;
  DELETE FROM crm_contacts WHERE tenant_id = test_tenant_id;
  DELETE FROM contact_identities WHERE tenant_id = test_tenant_id;
  
  RAISE NOTICE '✅ Test data cleaned up';
  
END $$;

\echo ''
\echo '================================='
\echo '✅ Idempotency test complete'
\echo '================================='
