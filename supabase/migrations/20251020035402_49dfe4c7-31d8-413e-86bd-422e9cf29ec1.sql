-- Fix recall function to return actual content
DROP FUNCTION IF EXISTS public.recall_long_memory(text, integer);

CREATE OR REPLACE FUNCTION public.recall_long_memory(
  p_query text,
  p_limit int DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  kind text,
  key text,
  value jsonb,
  content text,
  score float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First try rocker_long_memory with vector search if embeddings exist
  RETURN QUERY
  SELECT 
    m.id,
    m.kind,
    m.key,
    m.value,
    COALESCE(m.value->>'content', m.value::text) as content,
    0.95::float as score
  FROM public.rocker_long_memory m
  WHERE m.user_id = auth.uid()
    AND m.embedding IS NOT NULL
    AND (
      m.key ILIKE '%' || p_query || '%'
      OR m.value::text ILIKE '%' || p_query || '%'
    )
  ORDER BY 
    CASE WHEN m.pinned THEN 0 ELSE 1 END,
    m.priority DESC,
    m.created_at DESC
  LIMIT GREATEST(p_limit, 0);

  -- Also check rocker_memories table
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      rm.id,
      rm.kind,
      COALESCE(rm.title, '') as key,
      jsonb_build_object('content', rm.content, 'title', rm.title, 'tags', rm.tags) as value,
      rm.content,
      0.85::float as score
    FROM public.rocker_memories rm
    WHERE rm.user_id = auth.uid()
      AND (
        rm.title ILIKE '%' || p_query || '%'
        OR rm.content ILIKE '%' || p_query || '%'
        OR p_query = ANY(rm.tags)
      )
    ORDER BY rm.importance DESC, rm.created_at DESC
    LIMIT GREATEST(p_limit, 0);
  END IF;
END;
$$;

-- Create rocker_knowledge table for chunked document content
CREATE TABLE IF NOT EXISTS public.rocker_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_id uuid REFERENCES public.rocker_memories(id) ON DELETE CASCADE,
  source_id uuid,
  chunk_index int NOT NULL DEFAULT 0,
  content text NOT NULL,
  embedding vector(768),
  meta jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies for rocker_knowledge
ALTER TABLE public.rocker_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own knowledge chunks"
  ON public.rocker_knowledge FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge chunks"
  ON public.rocker_knowledge FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge chunks"
  ON public.rocker_knowledge FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge chunks"
  ON public.rocker_knowledge FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for rocker_knowledge
CREATE INDEX IF NOT EXISTS idx_rocker_knowledge_user ON public.rocker_knowledge(user_id);
CREATE INDEX IF NOT EXISTS idx_rocker_knowledge_memory ON public.rocker_knowledge(memory_id);
CREATE INDEX IF NOT EXISTS idx_rocker_knowledge_embedding ON public.rocker_knowledge 
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;

-- Update runtime flags for web access
INSERT INTO public.runtime_flags (key, value)
VALUES 
  ('capabilities.web_access', '{"enabled": true, "mode": "allowlist", "admin_only": false}'::jsonb),
  ('rocker.always_on', '{"enabled": false}'::jsonb),
  ('rocker.daily_checkin', '{"enabled": false, "hour": 9}'::jsonb),
  ('rocker.evening_wrap', '{"enabled": false, "hour": 20}'::jsonb),
  ('rocker.task_nag', '{"enabled": false, "interval_min": 120}'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();