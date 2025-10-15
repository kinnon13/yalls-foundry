-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge Items: Core content units
CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uri TEXT UNIQUE NOT NULL,
  scope TEXT CHECK (scope IN ('global','site','user')) NOT NULL,
  tenant_id UUID,
  category TEXT NOT NULL,
  subcategory TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'en',
  version INT NOT NULL DEFAULT 1,
  source_bucket_path TEXT,
  content_excerpt TEXT,
  embedding VECTOR(1536),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  permissions JSONB DEFAULT '{"visibility":"private","roles":["admin"]}'::JSONB
);

-- Knowledge Chunks: Searchable content segments
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE NOT NULL,
  idx INT NOT NULL,
  text TEXT NOT NULL,
  embedding VECTOR(1536),
  token_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Term Dictionary: Semantic term resolution
CREATE TABLE IF NOT EXISTS term_dictionary (
  term TEXT PRIMARY KEY,
  scope TEXT CHECK (scope IN ('global','site','user')) NOT NULL,
  tenant_id UUID,
  synonyms TEXT[] DEFAULT '{}',
  definition TEXT,
  source_uri TEXT,
  term_knowledge_id UUID REFERENCES term_knowledge(id),
  embedding VECTOR(1536),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playbooks: Intent-based workflows
CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent TEXT NOT NULL,
  scope TEXT CHECK (scope IN ('global','site','user')) NOT NULL,
  tenant_id UUID,
  version INT NOT NULL DEFAULT 1,
  required_slots JSONB DEFAULT '{}'::JSONB,
  steps JSONB NOT NULL,
  ask_templates JSONB DEFAULT '[]'::JSONB,
  from_knowledge_uri TEXT REFERENCES knowledge_items(uri),
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;

-- Knowledge Items RLS
CREATE POLICY "Global knowledge readable by all"
  ON knowledge_items FOR SELECT
  USING (scope = 'global');

CREATE POLICY "Site knowledge readable by authenticated"
  ON knowledge_items FOR SELECT
  USING (scope = 'site' AND auth.role() = 'authenticated');

CREATE POLICY "User knowledge readable by owner"
  ON knowledge_items FOR SELECT
  USING (scope = 'user' AND tenant_id = auth.uid());

CREATE POLICY "Admins can manage all knowledge"
  ON knowledge_items FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Knowledge Chunks RLS (inherit from items)
CREATE POLICY "Chunks readable if item is"
  ON knowledge_chunks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM knowledge_items ki
    WHERE ki.id = knowledge_chunks.item_id
    AND (
      ki.scope = 'global'
      OR (ki.scope = 'site' AND auth.role() = 'authenticated')
      OR (ki.scope = 'user' AND ki.tenant_id = auth.uid())
      OR has_role(auth.uid(), 'admin')
    )
  ));

CREATE POLICY "Admins can manage chunks"
  ON knowledge_chunks FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Term Dictionary RLS
CREATE POLICY "Global terms readable by all"
  ON term_dictionary FOR SELECT
  USING (scope = 'global');

CREATE POLICY "Site terms readable by authenticated"
  ON term_dictionary FOR SELECT
  USING (scope = 'site' AND auth.role() = 'authenticated');

CREATE POLICY "User terms readable by owner"
  ON term_dictionary FOR SELECT
  USING (scope = 'user' AND tenant_id = auth.uid());

CREATE POLICY "Admins can manage terms"
  ON term_dictionary FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Playbooks RLS
CREATE POLICY "Global playbooks readable by all"
  ON playbooks FOR SELECT
  USING (scope = 'global');

CREATE POLICY "Site playbooks readable by authenticated"
  ON playbooks FOR SELECT
  USING (scope = 'site' AND auth.role() = 'authenticated');

CREATE POLICY "User playbooks readable by owner"
  ON playbooks FOR SELECT
  USING (scope = 'user' AND tenant_id = auth.uid());

CREATE POLICY "Admins can manage playbooks"
  ON playbooks FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_knowledge_items_scope_category ON knowledge_items(scope, category);
CREATE INDEX idx_knowledge_items_tenant ON knowledge_items(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_knowledge_items_tags ON knowledge_items USING GIN(tags);
CREATE INDEX idx_knowledge_chunks_item ON knowledge_chunks(item_id);
CREATE INDEX idx_term_dictionary_scope ON term_dictionary(scope);
CREATE INDEX idx_term_dictionary_tenant ON term_dictionary(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_playbooks_intent_scope ON playbooks(intent, scope);
CREATE INDEX idx_playbooks_tenant ON playbooks(tenant_id) WHERE tenant_id IS NOT NULL;

-- HNSW indexes for vector search (pgvector)
CREATE INDEX idx_knowledge_items_embedding ON knowledge_items 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_term_dictionary_embedding ON term_dictionary 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_playbooks_embedding ON playbooks 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Text search indexes
CREATE INDEX idx_knowledge_items_title ON knowledge_items USING gin(to_tsvector('english', title));
CREATE INDEX idx_knowledge_items_summary ON knowledge_items USING gin(to_tsvector('english', summary));
CREATE INDEX idx_knowledge_chunks_text ON knowledge_chunks USING gin(to_tsvector('english', text));

-- Helper function for scope-based retrieval
CREATE OR REPLACE FUNCTION get_knowledge_scope_filter(
  p_user_id UUID,
  p_tenant_id UUID DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  IF has_role(p_user_id, 'admin') THEN
    RETURN 'TRUE'; -- Admins see all
  END IF;
  
  IF p_tenant_id IS NOT NULL THEN
    RETURN format(
      '(scope = ''global'' OR (scope = ''site'') OR (scope = ''user'' AND tenant_id = %L))',
      p_tenant_id
    );
  ELSE
    RETURN '(scope = ''global'' OR scope = ''site'')';
  END IF;
END;
$$;