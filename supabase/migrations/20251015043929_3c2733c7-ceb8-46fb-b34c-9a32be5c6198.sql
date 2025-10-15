-- Add HNSW indexes for fast vector search (2025 best practice for pgvector)
-- HNSW is faster than IVFFlat for high-QPS recall at scale

-- Index on ai_user_memory embeddings
CREATE INDEX IF NOT EXISTS idx_ai_user_memory_hnsw
ON ai_user_memory USING hnsw (embedding vector_cosine_ops)
WITH (m=16, ef_construction=64);

-- Index on ai_global_knowledge embeddings
CREATE INDEX IF NOT EXISTS idx_ai_global_knowledge_hnsw
ON ai_global_knowledge USING hnsw (embedding vector_cosine_ops)
WITH (m=16, ef_construction=64);

-- Add composite index for common user memory queries
CREATE INDEX IF NOT EXISTS idx_ai_user_memory_user_updated
ON ai_user_memory(user_id, updated_at DESC);

-- Add index for consent checks (hot path)
CREATE INDEX IF NOT EXISTS idx_ai_user_consent_user_optin
ON ai_user_consent(user_id, site_opt_in)
WHERE site_opt_in = true;