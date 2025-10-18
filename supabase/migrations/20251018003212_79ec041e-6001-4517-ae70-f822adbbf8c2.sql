-- =====================================================
-- Favorites System - Complete DB Implementation
-- =====================================================

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fav_type text NOT NULL CHECK (fav_type IN ('post','event','entity','horse','listing')),
  ref_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, fav_type, ref_id)
);

-- Create index for fast user queries
CREATE INDEX IF NOT EXISTS idx_favs_user_created ON public.favorites (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favs_type_ref ON public.favorites (fav_type, ref_id);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own favorites
CREATE POLICY favorites_owner_rw ON public.favorites
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- RPC: favorite_toggle
-- =====================================================
CREATE OR REPLACE FUNCTION public.favorite_toggle(
  p_fav_type text,
  p_ref_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_id uuid;
  v_is_favorited boolean;
BEGIN
  -- Validate user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if already favorited
  SELECT id INTO v_existing_id
  FROM public.favorites
  WHERE user_id = v_user_id 
    AND fav_type = p_fav_type 
    AND ref_id = p_ref_id;

  IF v_existing_id IS NOT NULL THEN
    -- Remove favorite
    DELETE FROM public.favorites WHERE id = v_existing_id;
    v_is_favorited := false;
  ELSE
    -- Add favorite
    INSERT INTO public.favorites (user_id, fav_type, ref_id)
    VALUES (v_user_id, p_fav_type, p_ref_id);
    v_is_favorited := true;
  END IF;

  RETURN jsonb_build_object(
    'is_favorited', v_is_favorited,
    'fav_type', p_fav_type,
    'ref_id', p_ref_id
  );
END;
$$;

-- =====================================================
-- RPC: favorites_list
-- =====================================================
CREATE OR REPLACE FUNCTION public.favorites_list(
  p_user_id uuid,
  p_fav_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  fav_type text,
  ref_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Users can only see their own favorites
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    f.id,
    f.user_id,
    f.fav_type,
    f.ref_id,
    f.created_at
  FROM public.favorites f
  WHERE f.user_id = p_user_id
    AND (p_fav_type IS NULL OR f.fav_type = p_fav_type)
  ORDER BY f.created_at DESC;
END;
$$;

-- =====================================================
-- RPC: favorites_check (batch check if items are favorited)
-- =====================================================
CREATE OR REPLACE FUNCTION public.favorites_check(
  p_items jsonb
)
RETURNS TABLE (
  ref_id uuid,
  is_favorited boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    (item->>'ref_id')::uuid as ref_id,
    EXISTS(
      SELECT 1 FROM public.favorites f
      WHERE f.user_id = v_user_id
        AND f.fav_type = item->>'fav_type'
        AND f.ref_id = (item->>'ref_id')::uuid
    ) as is_favorited
  FROM jsonb_array_elements(p_items) item;
END;
$$;