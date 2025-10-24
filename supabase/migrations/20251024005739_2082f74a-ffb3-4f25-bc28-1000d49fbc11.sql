-- Memory Collections (folders for organized recall)
CREATE TABLE IF NOT EXISTS andy_memory_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_andy_collections_user ON andy_memory_collections(user_id);

-- Collection Items (link memories to collections)
CREATE TABLE IF NOT EXISTS andy_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES andy_memory_collections(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES ai_user_memory(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, memory_id)
);

CREATE INDEX idx_collection_items_collection ON andy_collection_items(collection_id);
CREATE INDEX idx_collection_items_memory ON andy_collection_items(memory_id);

-- Research Queues (topics Andy should research and expand)
CREATE TABLE IF NOT EXISTS andy_research_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  query TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'researching', 'completed', 'failed')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  collection_id UUID REFERENCES andy_memory_collections(id) ON DELETE SET NULL,
  findings TEXT,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_research_queue_user_status ON andy_research_queue(user_id, status);
CREATE INDEX idx_research_queue_priority ON andy_research_queue(priority DESC);

-- RLS Policies
ALTER TABLE andy_memory_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE andy_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE andy_research_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own collections"
  ON andy_memory_collections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own collection items"
  ON andy_collection_items
  FOR ALL
  USING (
    collection_id IN (
      SELECT id FROM andy_memory_collections WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own research queue"
  ON andy_research_queue
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_andy_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_andy_collections_timestamp
  BEFORE UPDATE ON andy_memory_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_andy_collections_updated_at();

-- Function to auto-suggest collections based on memory content
CREATE OR REPLACE FUNCTION andy_suggest_collections(p_user_id UUID)
RETURNS TABLE(suggested_name TEXT, memory_count BIGINT) AS $$
BEGIN
  -- Simple keyword-based clustering (can be enhanced with embeddings)
  RETURN QUERY
  SELECT 
    COALESCE(
      CASE
        WHEN content ILIKE '%task%' OR content ILIKE '%todo%' THEN 'Tasks & Projects'
        WHEN content ILIKE '%meeting%' OR content ILIKE '%call%' THEN 'Meetings & Calls'
        WHEN content ILIKE '%idea%' OR content ILIKE '%note%' THEN 'Ideas & Notes'
        WHEN content ILIKE '%person%' OR content ILIKE '%contact%' THEN 'People & Contacts'
        ELSE 'General Knowledge'
      END,
      'Uncategorized'
    ) AS suggested_name,
    COUNT(*) AS memory_count
  FROM ai_user_memory
  WHERE user_id = p_user_id
  GROUP BY suggested_name
  ORDER BY memory_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;