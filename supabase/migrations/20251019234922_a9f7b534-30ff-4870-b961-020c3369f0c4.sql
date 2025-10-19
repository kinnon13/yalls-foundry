-- Fix the onboarding interest functions that are causing scalar extraction errors

-- Drop and recreate user_interests_upsert function
DROP FUNCTION IF EXISTS public.user_interests_upsert(jsonb);
CREATE OR REPLACE FUNCTION public.user_interests_upsert(p_items text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items jsonb;
  v_item jsonb;
  v_user_id uuid;
BEGIN
  -- Parse the JSON string
  v_items := p_items::jsonb;
  
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Loop through items and upsert
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    INSERT INTO public.user_interests (
      user_id,
      interest_id,
      affinity,
      confidence,
      source
    )
    VALUES (
      v_user_id,
      (v_item->>'interest_id')::uuid,
      COALESCE((v_item->>'affinity')::numeric, 0.8),
      COALESCE(v_item->>'confidence', 'explicit'::text),
      COALESCE(v_item->>'source', 'onboarding'::text)
    )
    ON CONFLICT (user_id, interest_id) 
    DO UPDATE SET
      affinity = EXCLUDED.affinity,
      confidence = EXCLUDED.confidence,
      updated_at = now();
  END LOOP;
END;
$$;

-- Drop and recreate ensure_category_for_interest function
DROP FUNCTION IF EXISTS public.ensure_category_for_interest(uuid);
CREATE OR REPLACE FUNCTION public.ensure_category_for_interest(p_interest_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain text;
  v_category_name text;
BEGIN
  -- Get the domain from interest_catalog
  SELECT domain INTO v_domain
  FROM public.interest_catalog
  WHERE id = p_interest_id
  LIMIT 1;

  IF v_domain IS NULL THEN
    -- Try interests_catalog as fallback
    SELECT domain INTO v_domain
    FROM public.interests_catalog
    WHERE id = p_interest_id
    LIMIT 1;
  END IF;

  IF v_domain IS NULL THEN
    RETURN; -- No domain found, skip
  END IF;

  -- Create marketplace category if it doesn't exist
  v_category_name := initcap(v_domain);
  
  INSERT INTO public.marketplace_categories (name, slug, description)
  VALUES (
    v_category_name,
    lower(regexp_replace(v_domain, '[^a-zA-Z0-9]+', '-', 'g')),
    'Auto-generated category for ' || v_domain
  )
  ON CONFLICT (slug) DO NOTHING;
END;
$$;

-- Drop and recreate enqueue_discovery_for_user function  
DROP FUNCTION IF EXISTS public.enqueue_discovery_for_user(uuid);
CREATE OR REPLACE FUNCTION public.enqueue_discovery_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This would typically enqueue a background job
  -- For now, just log to a discovery_queue table if it exists
  -- Or do nothing if the table doesn't exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'discovery_queue'
  ) THEN
    INSERT INTO public.discovery_queue (user_id, status, created_at)
    VALUES (p_user_id, 'pending', now())
    ON CONFLICT (user_id) DO UPDATE SET 
      status = 'pending',
      created_at = now();
  END IF;
END;
$$;

-- Drop and recreate emit_signal function
DROP FUNCTION IF EXISTS public.emit_signal(text, jsonb);
CREATE OR REPLACE FUNCTION public.emit_signal(p_name text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This is for telemetry/analytics
  -- Insert into a signals/events table if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'telemetry_events'
  ) THEN
    INSERT INTO public.telemetry_events (
      user_id,
      event_name,
      metadata,
      created_at
    )
    VALUES (
      auth.uid(),
      p_name,
      p_metadata,
      now()
    );
  END IF;
END;
$$;