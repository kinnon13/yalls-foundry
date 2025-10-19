-- Add marketplace RPCs one by one

-- 1) Emit signal
CREATE OR REPLACE FUNCTION public.emit_signal(
  p_name text,
  p_target_kind text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public
AS $$
  INSERT INTO public.intent_signals(user_id, name, target_kind, target_id, metadata)
  VALUES (auth.uid(), p_name, p_target_kind, p_target_id, COALESCE(p_metadata,'{}'::jsonb));
$$;

-- 2) Ensure category for interest
CREATE OR REPLACE FUNCTION public.ensure_category_for_interest(p_interest_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  v_interest interest_catalog%ROWTYPE;
  v_existing uuid;
  v_new_id uuid;
BEGIN
  SELECT * INTO v_interest FROM public.interest_catalog WHERE id = p_interest_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'interest_not_found'; END IF;

  SELECT im.category_id INTO v_existing
  FROM public.marketplace_interest_map im
  WHERE im.interest_id = p_interest_id
  ORDER BY im.confidence DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  v_new_id := gen_random_uuid();
  INSERT INTO public.marketplace_categories(id, slug, name, domain, category, tags)
  VALUES (
    v_new_id,
    slugify(v_interest.domain || '-' || v_interest.category || '-' || v_interest.tag),
    v_interest.domain || ' → ' || v_interest.category || ' → ' || v_interest.tag,
    v_interest.domain,
    v_interest.category,
    ARRAY[v_interest.tag]
  );

  INSERT INTO public.marketplace_interest_map(interest_id, category_id, confidence, source)
  VALUES (p_interest_id, v_new_id, 1.00, 'auto');

  INSERT INTO public.marketplace_discovery_queue(interest_id, category_id, reason, status)
  VALUES (p_interest_id, v_new_id, 'new-interest', 'queued');

  RETURN v_new_id;
END;
$$;

-- 3) Enqueue discovery for user
CREATE OR REPLACE FUNCTION public.enqueue_discovery_for_user(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  r record;
  v_ct int := 0;
  v_cat uuid;
BEGIN
  FOR r IN
    SELECT ui.interest_id
    FROM public.user_interests ui
    WHERE ui.user_id = p_user_id
  LOOP
    v_cat := public.ensure_category_for_interest(r.interest_id);
    INSERT INTO public.marketplace_discovery_queue(interest_id, category_id, reason, status)
    VALUES (r.interest_id, v_cat, 'user-signup', 'queued')
    ON CONFLICT DO NOTHING;
    v_ct := v_ct + 1;
  END LOOP;
  RETURN v_ct;
END;
$$;