-- Safety: Add phone constraint as NOT VALID (won't block on legacy data)
ALTER TABLE public.contact_identities
  DROP CONSTRAINT IF EXISTS chk_phone_format;

ALTER TABLE public.contact_identities
  ADD CONSTRAINT chk_phone_format
  CHECK (type <> 'phone' OR value ~ '^\+?[1-9]\d{6,15}$')
  NOT VALID;

-- Validate immediately (comment out if you need to clean data first)
ALTER TABLE public.contact_identities VALIDATE CONSTRAINT chk_phone_format;

-- Lock down function permissions
REVOKE ALL ON FUNCTION app.resolve_contact(uuid,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION app.resolve_contact(uuid,text,text,text,text) TO authenticated;

REVOKE ALL ON FUNCTION app.outbox_claim(int,uuid) FROM public;
GRANT EXECUTE ON FUNCTION app.outbox_claim(int,uuid) TO service_role;

-- Atomic event ingest: resolve + insert + emit in one transaction
CREATE OR REPLACE FUNCTION app.ingest_event(
  p_business uuid,
  p_type text,
  p_props jsonb,
  p_contact jsonb,   -- {email, phone, externalId, name}
  p_idem_key text    -- optional
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_result jsonb;
  v_contact_id uuid;
  v_changed boolean;
  v_props jsonb := COALESCE(p_props, '{}'::jsonb);
  v_email text;
  v_phone text;
  v_external text;
  v_name text;
BEGIN
  -- Idempotency check
  IF p_idem_key IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM crm_events 
       WHERE source='web' AND props->>'idemKey'=p_idem_key
    ) THEN
      RETURN jsonb_build_object('ok', true, 'idempotent', true);
    END IF;
    v_props := v_props || jsonb_build_object('idemKey', p_idem_key);
  END IF;

  -- Normalize contact hints
  v_email := NULLIF(LOWER(TRIM(COALESCE(p_contact->>'email',''))), '');
  v_phone := NULLIF(regexp_replace(COALESCE(p_contact->>'phone',''), '[^\d+]', '', 'g'), '');
  v_external := NULLIF(TRIM(COALESCE(p_contact->>'externalId','')), '');
  v_name := NULLIF(TRIM(COALESCE(p_contact->>'name','')), '');

  -- Resolve contact (atomic with locks)
  v_contact_result := app.resolve_contact(
    p_business,
    v_email,
    v_phone,
    v_name,
    v_external
  );

  v_contact_id := (v_contact_result->>'contact_id')::uuid;
  v_changed := COALESCE((v_contact_result->>'changed')::boolean, false);

  -- Insert event
  INSERT INTO crm_events(type, props, contact_hint, contact_id, ts, source)
  VALUES (p_type, v_props, p_contact, v_contact_id, NOW(), 'web');

  -- Emit to outbox if contact was created/updated
  IF v_changed THEN
    INSERT INTO outbox(topic, payload)
    VALUES (
      'contact.updated.v1',
      jsonb_build_object(
        'type', 'contact.updated.v1',
        'occurred_at', NOW(),
        'data', jsonb_build_object(
          'contact_id', v_contact_id,
          'business_id', p_business,
          'sources', p_contact
        )
      )
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'contactId', v_contact_id, 'changed', v_changed);
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION app.ingest_event(uuid,text,jsonb,jsonb,text) FROM public;
GRANT EXECUTE ON FUNCTION app.ingest_event(uuid,text,jsonb,jsonb,text) TO authenticated;