-- Long-term memory for Rocker
CREATE TABLE IF NOT EXISTS public.rocker_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  kind text NOT NULL DEFAULT 'fact' CHECK (kind IN ('fact','preference','goal','note','commitment','constraint')),
  tags text[] NOT NULL DEFAULT '{}',
  importance int NOT NULL DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- Fast filters
CREATE INDEX IF NOT EXISTS idx_mem_user_kind ON public.rocker_memories(user_id, kind, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mem_user_imp ON public.rocker_memories(user_id, importance DESC, created_at DESC);

-- RLS: owner + super_admin
ALTER TABLE public.rocker_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_mem_read ON public.rocker_memories;
CREATE POLICY p_mem_read ON public.rocker_memories
  FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS p_mem_write ON public.rocker_memories;
CREATE POLICY p_mem_write ON public.rocker_memories
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS p_mem_update ON public.rocker_memories;
CREATE POLICY p_mem_update ON public.rocker_memories
  FOR UPDATE USING (user_id = auth.uid() OR public.is_super_admin())
            WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS p_mem_delete ON public.rocker_memories;
CREATE POLICY p_mem_delete ON public.rocker_memories
  FOR DELETE USING (user_id = auth.uid() OR public.is_super_admin());

-- RPC: save memory (idempotent on title)
CREATE OR REPLACE FUNCTION public.save_memory(
  p_title text,
  p_content text,
  p_kind text DEFAULT 'fact',
  p_tags text[] DEFAULT '{}',
  p_importance int DEFAULT 1,
  p_expires_at timestamptz DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid;
BEGIN
  -- Try to find existing by title
  SELECT id INTO v_id FROM public.rocker_memories
    WHERE user_id = auth.uid() AND title = left(p_title,120)
    LIMIT 1;
    
  IF v_id IS NOT NULL THEN
    -- Update existing
    UPDATE public.rocker_memories
      SET content=p_content, kind=p_kind, tags=p_tags, 
          importance=least(greatest(p_importance,1),5),
          expires_at=p_expires_at, updated_at=now()
    WHERE id=v_id;
  ELSE
    -- Insert new
    INSERT INTO public.rocker_memories(user_id, title, content, kind, tags, importance, expires_at)
    VALUES (auth.uid(), left(p_title,120), p_content, p_kind, p_tags, 
            least(greatest(p_importance,1),5), p_expires_at)
    RETURNING id INTO v_id;
  END IF;
  
  RETURN v_id;
END $$;

-- RPC: recall memories (text search + recency/importance boost)
CREATE OR REPLACE FUNCTION public.recall_memories(p_query text, p_k int DEFAULT 8)
RETURNS TABLE(id uuid, title text, content text, kind text, tags text[], importance int, score float)
LANGUAGE plpgsql STABLE SET search_path=public AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT m.*,
      -- Score: text match + importance + recency
      (0.5 * (POSITION(lower(p_query) in lower(m.content)) > 0)::int +
       0.3 * (POSITION(lower(p_query) in lower(m.title)) > 0)::int +
       0.1 * m.importance +
       0.1 * CASE WHEN m.updated_at > now() - interval '7 days' THEN 1.0 ELSE 0.5 END
      ) AS s
    FROM public.rocker_memories m
    WHERE (m.user_id = auth.uid() OR public.is_super_admin())
      AND (m.expires_at IS NULL OR m.expires_at > now())
  )
  SELECT b.id, b.title, b.content, b.kind, b.tags, b.importance, b.s AS score
  FROM base b
  WHERE b.s > 0
  ORDER BY b.s DESC, b.updated_at DESC
  LIMIT greatest(1,p_k);
END $$;