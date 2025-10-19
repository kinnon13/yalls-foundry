
-- Fix ensure_category_for_interest to be VOLATILE (not STABLE) since it writes data

CREATE OR REPLACE FUNCTION public.ensure_category_for_interest(p_interest_id uuid)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  v_interest   interest_catalog%ROWTYPE;
  v_existing   uuid;
  v_new_id     uuid;
BEGIN
  SELECT * INTO v_interest FROM public.interest_catalog WHERE id = p_interest_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'interest_not_found'; END IF;

  -- Check if mapping already exists
  SELECT im.category_id
    INTO v_existing
  FROM public.marketplace_interest_map im
  WHERE im.interest_id = p_interest_id
  ORDER BY im.confidence DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Create a new category from domain/category/tag
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

  -- Map interest→category (manual 1.0)
  INSERT INTO public.marketplace_interest_map(interest_id, category_id, confidence, source)
  VALUES (p_interest_id, v_new_id, 1.00, 'manual');

  -- Enqueue discovery job (new-interest)
  INSERT INTO public.marketplace_discovery_queue(interest_id, category_id, reason, status)
  VALUES (p_interest_id, v_new_id, 'new-interest', 'queued');

  RETURN v_new_id;
END;
$$;
