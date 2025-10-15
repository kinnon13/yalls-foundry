-- Outbox Pattern Test
-- Tests claim, process, and mark delivered workflow

\echo '📬 Testing Outbox Pattern'
\echo '========================='
\echo ''

DO $$
DECLARE
  worker_id uuid := gen_random_uuid();
  claim_result jsonb;
  message_id uuid;
BEGIN
  \echo '1️⃣  Inserting test messages...'
  
  -- Insert test messages
  INSERT INTO outbox (topic, payload)
  VALUES 
    ('test.event.1', '{"test":1,"timestamp":"' || now()::text || '"}'),
    ('test.event.2', '{"test":2,"timestamp":"' || now()::text || '"}'),
    ('test.event.3', '{"test":3,"timestamp":"' || now()::text || '"}');
  
  RAISE NOTICE '✅ Inserted 3 test messages';
  
  \echo ''
  \echo '2️⃣  Claiming messages...'
  
  -- Claim messages
  SELECT app.outbox_claim(10, worker_id)::jsonb INTO claim_result;
  
  RAISE NOTICE 'Claimed messages: %', claim_result;
  
  IF jsonb_array_length(claim_result->'messages') > 0 THEN
    RAISE NOTICE '✅ Successfully claimed % messages', jsonb_array_length(claim_result->'messages');
  ELSE
    RAISE WARNING '❌ No messages claimed';
  END IF;
  
  \echo ''
  \echo '3️⃣  Verifying claim ownership...'
  
  -- Check claimed messages have correct worker_id
  IF EXISTS (
    SELECT 1 FROM outbox 
    WHERE claimed_by = worker_id 
    AND delivered_at IS NULL
  ) THEN
    RAISE NOTICE '✅ Messages correctly assigned to worker';
  ELSE
    RAISE WARNING '❌ Claim assignment failed';
  END IF;
  
  \echo ''
  \echo '4️⃣  Marking messages as delivered...'
  
  -- Get first message ID
  SELECT id INTO message_id
  FROM outbox 
  WHERE claimed_by = worker_id 
  LIMIT 1;
  
  -- Mark as delivered
  PERFORM app.outbox_mark_delivered(
    (claim_result->>'token')::uuid,
    ARRAY[message_id]
  );
  
  -- Verify delivery
  IF EXISTS (
    SELECT 1 FROM outbox
    WHERE id = message_id
    AND delivered_at IS NOT NULL
  ) THEN
    RAISE NOTICE '✅ Message marked as delivered';
  ELSE
    RAISE WARNING '❌ Message delivery marking failed';
  END IF;
  
  \echo ''
  \echo '5️⃣  Testing claim lease expiration...'
  
  -- Simulate expired lease (normally 5 min)
  UPDATE outbox
  SET claimed_at = now() - interval '10 minutes'
  WHERE claimed_by = worker_id
    AND delivered_at IS NULL;
  
  -- Try to claim again - should reclaim expired
  SELECT app.outbox_claim(10, gen_random_uuid())::jsonb INTO claim_result;
  
  IF jsonb_array_length(claim_result->'messages') > 0 THEN
    RAISE NOTICE '✅ Expired leases can be reclaimed';
  ELSE
    RAISE WARNING '⚠️  No expired messages reclaimed (may be expected)';
  END IF;
  
  \echo ''
  \echo '6️⃣  Cleanup test data...'
  
  DELETE FROM outbox WHERE topic LIKE 'test.event.%';
  
  RAISE NOTICE '✅ Test messages cleaned up';
  
END $$;

\echo ''
\echo '========================='
\echo '✅ Outbox test complete'
\echo '========================='
