-- RPC Contract Tests
-- Verify core RPCs work correctly with proper permissions

-- Setup test user context (replace with actual test user UUID)
DO $$
DECLARE
  test_user_id uuid := '11111111-1111-1111-1111-111111111111';
  test_entity_id uuid;
BEGIN
  -- Simulate authenticated user
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);

  -- Get a test entity (or create one)
  SELECT id INTO test_entity_id 
  FROM entities 
  WHERE owner_user_id = test_user_id 
  LIMIT 1;

  IF test_entity_id IS NULL THEN
    INSERT INTO entities (owner_user_id, kind, display_name, status)
    VALUES (test_user_id, 'business', 'Test Business', 'claimed')
    RETURNING id INTO test_entity_id;
  END IF;

  RAISE NOTICE 'Test Entity ID: %', test_entity_id;

  -- Test 1: Theme RPCs
  BEGIN
    RAISE NOTICE 'Testing get_theme...';
    PERFORM get_theme('user', test_user_id);
    RAISE NOTICE '✅ get_theme works';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ get_theme failed: %', SQLERRM;
  END;

  BEGIN
    RAISE NOTICE 'Testing set_theme_overrides...';
    PERFORM set_theme_overrides('user', test_user_id, '{"brand":{"primary":"#7C3AED"}}'::jsonb);
    RAISE NOTICE '✅ set_theme_overrides works';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ set_theme_overrides failed: %', SQLERRM;
  END;

  -- Test 2: Workspace KPIs
  BEGIN
    RAISE NOTICE 'Testing get_workspace_kpis...';
    PERFORM get_workspace_kpis(test_entity_id, '7d');
    RAISE NOTICE '✅ get_workspace_kpis works';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ get_workspace_kpis failed: %', SQLERRM;
  END;

  -- Test 3: Module recommendations
  BEGIN
    RAISE NOTICE 'Testing recommend_workspace_modules...';
    PERFORM recommend_workspace_modules(test_entity_id);
    RAISE NOTICE '✅ recommend_workspace_modules works';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ recommend_workspace_modules failed: %', SQLERRM;
  END;

  BEGIN
    RAISE NOTICE 'Testing accept_module_recommendation...';
    PERFORM accept_module_recommendation(test_entity_id, 'nba_tray');
    RAISE NOTICE '✅ accept_module_recommendation works';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ accept_module_recommendation failed: %', SQLERRM;
  END;

  -- Test 4: Role checks
  BEGIN
    RAISE NOTICE 'Testing has_role...';
    IF has_role(test_user_id, 'owner'::app_role) THEN
      RAISE NOTICE '✅ has_role works (user has owner role)';
    ELSE
      RAISE NOTICE '⚠️  has_role works but user does not have owner role';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ has_role failed: %', SQLERRM;
  END;

  RAISE NOTICE 'All RPC contract tests complete';
END $$;
