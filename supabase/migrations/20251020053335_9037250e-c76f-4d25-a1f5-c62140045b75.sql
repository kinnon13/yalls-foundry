-- Drop any indexes on rocker_knowledge.embedding to allow type change
DO $$ 
DECLARE idx RECORD;
BEGIN
  FOR idx IN
    SELECT i.relname AS indexname
    FROM pg_class t
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_index ix ON ix.indrelid = t.oid
    JOIN pg_class i ON i.oid = ix.indexrelid
    WHERE n.nspname = 'public'
      AND t.relname = 'rocker_knowledge'
      AND pg_get_indexdef(i.oid) ILIKE '%(embedding %'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
  END LOOP;
END $$;

-- Ensure column matches OpenAI text-embedding-3-small (1536 dims)
ALTER TABLE public.rocker_knowledge
  ALTER COLUMN embedding TYPE vector(1536);

-- Recreate HNSW index (cosine) on the embedding column
CREATE INDEX IF NOT EXISTS idx_rocker_knowledge_embedding
ON public.rocker_knowledge
USING hnsw (embedding vector_cosine_ops)
WITH (m=16, ef_construction=64)
WHERE embedding IS NOT NULL;

-- Requeue jobs whose knowledge rows still have null embeddings
UPDATE public.embedding_jobs ej
SET status = 'pending', updated_at = now(), last_error = NULL
FROM public.rocker_knowledge rk
WHERE ej.knowledge_id = rk.id
  AND rk.embedding IS NULL
  AND ej.status <> 'pending';