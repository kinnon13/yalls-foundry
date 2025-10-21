-- Knowledge Base Schema for Read-Only Ingestion
-- Supports site crawling, repo ingestion, and vector search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- KB Sources: tracks what we've ingested
CREATE TABLE IF NOT EXISTS kb_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('site', 'repo', 'manual')),
  base TEXT NOT NULL,
  allow TEXT[] DEFAULT '{}',
  deny TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kind, base)
);

-- KB Documents: individual pages/files
CREATE TABLE IF NOT EXISTS kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
  uri TEXT NOT NULL,
  title TEXT,
  text TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id, uri)
);

-- KB Chunks: vectorized segments for search
CREATE TABLE IF NOT EXISTS kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  idx INT NOT NULL,
  content TEXT NOT NULL,
  tokens INT NOT NULL DEFAULT 0,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kb_sources_kind ON kb_sources(kind);
CREATE INDEX IF NOT EXISTS idx_kb_documents_source ON kb_documents(source_id);
CREATE INDEX IF NOT EXISTS idx_kb_documents_sha256 ON kb_documents(sha256);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_doc ON kb_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding ON kb_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS Policies
ALTER TABLE kb_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY kb_sources_read ON kb_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY kb_documents_read ON kb_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY kb_chunks_read ON kb_chunks FOR SELECT TO authenticated USING (true);

CREATE POLICY kb_sources_write ON kb_sources FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));
CREATE POLICY kb_documents_write ON kb_documents FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));
CREATE POLICY kb_chunks_write ON kb_chunks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- Vector search function
CREATE OR REPLACE FUNCTION match_kb_chunks(query_embedding vector(1536), match_threshold float DEFAULT 0.7, match_count int DEFAULT 10, source_filter uuid DEFAULT NULL)
RETURNS TABLE (id uuid, doc_id uuid, content text, similarity float, uri text, title text)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT c.id, c.doc_id, c.content, 1 - (c.embedding <=> query_embedding) as similarity, d.uri, d.title
  FROM kb_chunks c JOIN kb_documents d ON d.id = c.doc_id
  WHERE (source_filter IS NULL OR d.source_id = source_filter) AND (1 - (c.embedding <=> query_embedding)) > match_threshold
  ORDER BY c.embedding <=> query_embedding LIMIT match_count;
END;
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_kb_sources_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_sources_updated_at BEFORE UPDATE ON kb_sources FOR EACH ROW EXECUTE FUNCTION update_kb_sources_updated_at();