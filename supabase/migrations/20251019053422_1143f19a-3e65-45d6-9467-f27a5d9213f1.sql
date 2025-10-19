-- CRM contact upsert RPC for follow flow
CREATE OR REPLACE FUNCTION public.crm_upsert_contact(
  p_business_id uuid,
  p_name text,
  p_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contact_id uuid;
  v_user_email text;
BEGIN
  -- Get user email from auth
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  -- Try to find existing contact by email or phone
  SELECT id INTO v_contact_id
  FROM public.crm_contacts
  WHERE owner_user_id = (SELECT owner_user_id FROM entities WHERE id = p_business_id LIMIT 1)
    AND (
      (p_phone IS NOT NULL AND phone = p_phone)
      OR (v_user_email IS NOT NULL AND email = v_user_email::citext)
    )
  LIMIT 1;

  IF v_contact_id IS NULL THEN
    -- Create new contact
    INSERT INTO public.crm_contacts (
      owner_user_id,
      name,
      email,
      phone,
      business_id,
      tenant_id,
      tags
    )
    SELECT 
      e.owner_user_id,
      p_name,
      v_user_email::citext,
      p_phone,
      p_business_id,
      e.owner_user_id,
      '["auto_follow"]'::jsonb
    FROM entities e
    WHERE e.id = p_business_id
    RETURNING id INTO v_contact_id;
  ELSE
    -- Update existing contact
    UPDATE public.crm_contacts
    SET 
      name = COALESCE(p_name, name),
      phone = COALESCE(p_phone, phone),
      status = 'active',
      tags = CASE 
        WHEN tags ? 'auto_follow' THEN tags
        ELSE tags || '["auto_follow"]'::jsonb
      END,
      updated_at = now()
    WHERE id = v_contact_id;
  END IF;

  -- Log to AI ledger
  INSERT INTO public.ai_action_ledger (
    user_id,
    agent,
    action,
    input,
    output,
    result
  ) VALUES (
    auth.uid(),
    'follow_system',
    'crm_contact_upserted',
    jsonb_build_object('business_id', p_business_id, 'name', p_name),
    jsonb_build_object('contact_id', v_contact_id),
    'success'
  );

  RETURN v_contact_id;
END;
$$;

-- RPC to handle unfollow with options
CREATE OR REPLACE FUNCTION public.connection_unfollow(
  p_entity_id uuid,
  p_action text DEFAULT 'unfollow' -- 'unfollow' | 'silent_unsubscribe' | 'block'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_contact_id uuid;
BEGIN
  -- Remove connection
  DELETE FROM public.connection_edges
  WHERE user_id = auth.uid() AND entity_id = p_entity_id;

  -- Handle CRM contact based on action
  SELECT id INTO v_contact_id
  FROM public.crm_contacts
  WHERE owner_user_id = (SELECT owner_user_id FROM entities WHERE id = p_entity_id LIMIT 1)
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())::citext
  LIMIT 1;

  IF v_contact_id IS NOT NULL THEN
    CASE p_action
      WHEN 'silent_unsubscribe' THEN
        UPDATE public.crm_contacts
        SET status = 'unsubscribed', updated_at = now()
        WHERE id = v_contact_id;
      WHEN 'unfollow' THEN
        UPDATE public.crm_contacts
        SET status = 'inactive', updated_at = now()
        WHERE id = v_contact_id;
      WHEN 'block' THEN
        UPDATE public.crm_contacts
        SET status = 'blocked', updated_at = now()
        WHERE id = v_contact_id;
    END CASE;
  END IF;

  -- Log to AI ledger
  INSERT INTO public.ai_action_ledger (
    user_id,
    agent,
    action,
    input,
    output,
    result
  ) VALUES (
    auth.uid(),
    'follow_system',
    'connection_unfollow_' || p_action,
    jsonb_build_object('entity_id', p_entity_id, 'action', p_action),
    jsonb_build_object('contact_id', v_contact_id),
    'success'
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'contact_id', v_contact_id
  );
END;
$$;