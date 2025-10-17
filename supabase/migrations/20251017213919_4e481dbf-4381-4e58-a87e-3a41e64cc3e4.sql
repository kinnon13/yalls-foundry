-- P0.2: Favorites System (posts, entities, events, horses)
-- Universal favorites with fast toggles and profile tab

CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fav_type TEXT NOT NULL CHECK (fav_type IN ('post', 'entity', 'event', 'horse', 'listing', 'profile')),
  ref_id UUID NOT NULL,
  note TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, fav_type, ref_id)
);

-- Composite indexes for fast lookup and listing
CREATE INDEX idx_favorites_user_type_created ON public.favorites(user_id, fav_type, created_at DESC, id DESC);
CREATE INDEX idx_favorites_ref ON public.favorites(ref_id, fav_type);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RPC: Toggle favorite (idempotent, fast)
CREATE OR REPLACE FUNCTION public.favorite_toggle(
  p_fav_type TEXT,
  p_ref_id UUID,
  p_note TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
  v_action TEXT;
BEGIN
  -- Check if favorite exists
  SELECT EXISTS(
    SELECT 1 FROM public.favorites
    WHERE user_id = auth.uid()
      AND fav_type = p_fav_type
      AND ref_id = p_ref_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove favorite
    DELETE FROM public.favorites
    WHERE user_id = auth.uid()
      AND fav_type = p_fav_type
      AND ref_id = p_ref_id;
    v_action := 'removed';
  ELSE
    -- Add favorite
    INSERT INTO public.favorites (user_id, fav_type, ref_id, note, tags)
    VALUES (auth.uid(), p_fav_type, p_ref_id, p_note, p_tags)
    ON CONFLICT (user_id, fav_type, ref_id) DO NOTHING;
    v_action := 'added';
  END IF;

  -- Log for AI learning
  INSERT INTO public.ai_action_ledger (user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'favorite_toggle',
    jsonb_build_object('type', p_fav_type, 'ref_id', p_ref_id),
    jsonb_build_object('action', v_action),
    'success'
  );

  RETURN jsonb_build_object(
    'favorited', NOT v_exists,
    'action', v_action
  );
END;
$$;

-- RPC: Get favorites by type
CREATE OR REPLACE FUNCTION public.favorites_list(
  p_fav_type TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  fav_type TEXT,
  ref_id UUID,
  note TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.fav_type,
    f.ref_id,
    f.note,
    f.tags,
    f.created_at
  FROM public.favorites f
  WHERE f.user_id = auth.uid()
    AND (p_fav_type IS NULL OR f.fav_type = p_fav_type)
  ORDER BY f.created_at DESC, f.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- RPC: Check if item is favorited (bulk check for UI)
CREATE OR REPLACE FUNCTION public.favorites_check(p_items JSONB)
RETURNS TABLE(ref_id UUID, is_favorited BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (item->>'ref_id')::UUID as ref_id,
    EXISTS(
      SELECT 1 FROM public.favorites f
      WHERE f.user_id = auth.uid()
        AND f.fav_type = item->>'fav_type'
        AND f.ref_id = (item->>'ref_id')::UUID
    ) as is_favorited
  FROM jsonb_array_elements(p_items) item;
END;
$$;