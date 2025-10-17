-- PR B2: entry_submit RPC
CREATE OR REPLACE FUNCTION public.entry_submit(
  p_class_id UUID,
  p_rider_user_id UUID,
  p_horse_entity_id UUID DEFAULT NULL,
  p_opts JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
  v_fees_cents INT;
BEGIN
  -- Calculate fees from class
  SELECT 
    (fees_jsonb->>'entry_cents')::int + (fees_jsonb->>'office_cents')::int
  INTO v_fees_cents
  FROM event_classes
  WHERE id = p_class_id;

  INSERT INTO entries (class_id, rider_user_id, horse_entity_id, fees_cents, status)
  VALUES (p_class_id, p_rider_user_id, p_horse_entity_id, v_fees_cents, 'pending')
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END $$;