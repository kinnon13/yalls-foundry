-- Atomic follow → pin → CRM upsert RPC
CREATE OR REPLACE FUNCTION public.follow_and_pin(
  p_business_id uuid,
  p_apps text[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_pin_max int := 24;
  v_lock_days int := 7;
  v_locked_until timestamptz := v_now + (v_lock_days || ' days')::interval;
  v_pin_id uuid;
  v_evicted uuid;
  v_contact_id uuid;
  v_user_email text;
  v_user_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Get user info
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  SELECT display_name INTO v_user_name FROM profiles WHERE user_id = v_user_id;

  -- A) Create follow edge (idempotent)
  INSERT INTO public.connection_edges(user_id, entity_id, edge_type)
  VALUES (v_user_id, p_business_id, 'follow')
  ON CONFLICT (user_id, entity_id, edge_type) DO NOTHING;

  -- B) Evict if over pin cap
  IF (SELECT count(*) FROM public.user_pins WHERE user_id = v_user_id) >= v_pin_max THEN
    DELETE FROM public.user_pins
    WHERE id IN (
      SELECT id FROM public.user_pins
      WHERE user_id = v_user_id AND origin = 'auto_follow'
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING id INTO v_evicted;
  END IF;

  -- C) Create/update pin with lock
  INSERT INTO public.user_pins(user_id, pin_type, ref_id, origin, locked_until, lock_reason, use_count, metadata)
  VALUES (v_user_id, 'entity', p_business_id, 'auto_follow', v_locked_until, 'auto_follow_business', 0, jsonb_build_object('apps', p_apps))
  ON CONFLICT (user_id, pin_type, ref_id) DO UPDATE
  SET locked_until = EXCLUDED.locked_until,
      lock_reason = EXCLUDED.lock_reason,
      updated_at = now()
  RETURNING id INTO v_pin_id;

  -- D) Upsert CRM contact
  INSERT INTO public.crm_contacts(
    owner_user_id,
    name,
    email,
    business_id,
    tenant_id,
    status,
    tags
  )
  SELECT 
    e.owner_user_id,
    COALESCE(v_user_name, v_user_email),
    v_user_email::citext,
    p_business_id,
    e.owner_user_id,
    'active',
    '["auto_follow"]'::jsonb
  FROM entities e
  WHERE e.id = p_business_id
  ON CONFLICT (owner_user_id, email, business_id) DO UPDATE
  SET name = EXCLUDED.name,
      status = 'active',
      updated_at = now()
  RETURNING id INTO v_contact_id;

  -- E) Log to AI ledger
  INSERT INTO public.ai_action_ledger(user_id, agent, action, input, output, result)
  VALUES (
    v_user_id,
    'system',
    'follow_and_pin',
    jsonb_build_object('businessId', p_business_id, 'apps', p_apps),
    jsonb_build_object('pinId', v_pin_id, 'evicted', v_evicted, 'contactId', v_contact_id),
    'success'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'pin_id', v_pin_id,
    'locked_until', v_locked_until,
    'evicted', v_evicted,
    'contact_id', v_contact_id
  );
END;
$$;

-- Unfollow with options RPC
CREATE OR REPLACE FUNCTION public.unfollow_options(
  p_business_id uuid,
  p_mode text  -- 'silent_unsubscribe' | 'unfollow' | 'block'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_email text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  IF p_mode = 'silent_unsubscribe' THEN
    -- Keep follow, mark CRM as unsubscribed
    UPDATE public.crm_contacts
    SET status = 'unsubscribed', updated_at = now()
    WHERE business_id = p_business_id 
      AND email = v_user_email::citext;

  ELSIF p_mode = 'unfollow' THEN
    -- Remove follow edge
    DELETE FROM public.connection_edges
    WHERE user_id = v_user_id 
      AND entity_id = p_business_id 
      AND edge_type = 'follow';
    
    -- Remove pin if not locked
    DELETE FROM public.user_pins
    WHERE user_id = v_user_id 
      AND pin_type = 'entity' 
      AND ref_id = p_business_id
      AND (locked_until IS NULL OR locked_until <= now());
    
    -- Mark CRM as inactive
    UPDATE public.crm_contacts
    SET status = 'inactive', updated_at = now()
    WHERE business_id = p_business_id 
      AND email = v_user_email::citext;

  ELSIF p_mode = 'block' THEN
    -- Remove follow
    DELETE FROM public.connection_edges
    WHERE user_id = v_user_id 
      AND entity_id = p_business_id 
      AND edge_type = 'follow';
    
    -- Force remove pin
    DELETE FROM public.user_pins
    WHERE user_id = v_user_id 
      AND pin_type = 'entity' 
      AND ref_id = p_business_id;
    
    -- Mark CRM as blocked
    UPDATE public.crm_contacts
    SET status = 'blocked', updated_at = now()
    WHERE business_id = p_business_id 
      AND email = v_user_email::citext;

  ELSE
    RAISE EXCEPTION 'invalid_mode';
  END IF;

  -- Log to AI ledger
  INSERT INTO public.ai_action_ledger(user_id, agent, action, input, output, result)
  VALUES (
    v_user_id,
    'system',
    'unfollow_options',
    jsonb_build_object('businessId', p_business_id, 'mode', p_mode),
    '{}'::jsonb,
    'success'
  );

  RETURN jsonb_build_object('ok', true, 'mode', p_mode);
END;
$$;