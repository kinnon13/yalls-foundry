-- ============================================
-- Super Rocker: Missing Search Functions
-- ============================================
-- Creates hybrid search and vector match functions for rocker_knowledge

-- 1. Vector-only search (fallback)
CREATE OR REPLACE FUNCTION public.match_rocker_memory_vec(
  q vector(1536),
  match_count int DEFAULT 10,
  thread uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content text,
  chunk_index int,
  meta jsonb,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rk.id,
    rk.user_id,
    rk.content,
    rk.chunk_index,
    rk.meta,
    1 - (rk.embedding <=> q) as similarity,
    rk.created_at
  FROM rocker_knowledge rk
  WHERE 
    (thread IS NULL OR rk.meta->>'thread_id' = thread::text)
    AND rk.embedding IS NOT NULL
  ORDER BY rk.embedding <=> q
  LIMIT match_count;
END;
$$;

-- 2. Hybrid search (vector + text)
CREATE OR REPLACE FUNCTION public.search_hybrid(
  q_vec vector(1536),
  q_text text,
  k int DEFAULT 20,
  alpha float DEFAULT 0.7,
  thread uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content text,
  chunk_index int,
  meta jsonb,
  score float,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  max_vec_score float := 0;
  max_text_score float := 0;
BEGIN
  -- Get max scores for normalization
  SELECT MAX(1 - (rk.embedding <=> q_vec))
  INTO max_vec_score
  FROM rocker_knowledge rk
  WHERE rk.embedding IS NOT NULL
    AND (thread IS NULL OR rk.meta->>'thread_id' = thread::text);

  SELECT MAX(ts_rank_cd(to_tsvector('english', rk.content), plainto_tsquery('english', q_text)))
  INTO max_text_score
  FROM rocker_knowledge rk
  WHERE (thread IS NULL OR rk.meta->>'thread_id' = thread::text);

  -- Normalize scores to 0-1 range
  max_vec_score := GREATEST(max_vec_score, 0.001);
  max_text_score := GREATEST(max_text_score, 0.001);

  RETURN QUERY
  SELECT 
    rk.id,
    rk.user_id,
    rk.content,
    rk.chunk_index,
    rk.meta,
    -- Hybrid score: alpha * vector + (1-alpha) * text
    (
      alpha * ((1 - (rk.embedding <=> q_vec)) / max_vec_score) +
      (1 - alpha) * (ts_rank_cd(to_tsvector('english', rk.content), plainto_tsquery('english', q_text)) / max_text_score)
    ) as score,
    1 - (rk.embedding <=> q_vec) as similarity,
    rk.created_at
  FROM rocker_knowledge rk
  WHERE 
    (thread IS NULL OR rk.meta->>'thread_id' = thread::text)
    AND rk.embedding IS NOT NULL
  ORDER BY score DESC
  LIMIT k;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.match_rocker_memory_vec TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_rocker_memory_vec TO service_role;
GRANT EXECUTE ON FUNCTION public.search_hybrid TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_hybrid TO service_role;

-- Add text search index to rocker_knowledge for better performance
CREATE INDEX IF NOT EXISTS idx_rocker_knowledge_content_search 
ON rocker_knowledge USING gin(to_tsvector('english', content));

-- Verify vector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;