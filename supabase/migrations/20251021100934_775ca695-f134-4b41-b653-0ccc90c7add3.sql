-- Andy's own research and knowledge base (separate from user memories)
CREATE TABLE IF NOT EXISTS andy_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  research_type TEXT NOT NULL, -- 'analysis', 'pattern', 'connection', 'inference', 'deep_dive'
  topic TEXT NOT NULL,
  content JSONB NOT NULL, -- Andy's findings, sources, confidence, methodology
  source_memory_ids UUID[], -- which user memories triggered this research
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Andy's enhancements of user memories
CREATE TABLE IF NOT EXISTS andy_memory_enhancements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_memory_id UUID, -- references rocker_long_memory
  source_knowledge_id UUID, -- references rocker_knowledge
  enhancement_type TEXT NOT NULL, -- 'context', 'connection', 'categorization', 'expansion'
  original_content TEXT NOT NULL,
  enhanced_content JSONB NOT NULL, -- Andy's enhanced version with categories, micro-categories, etc.
  reasoning TEXT NOT NULL, -- why Andy made these enhancements
  confidence NUMERIC DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Andy's learning log - timestamped record of what he learned and why
CREATE TABLE IF NOT EXISTS andy_learning_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learned_at TIMESTAMPTZ DEFAULT now(),
  learning_type TEXT NOT NULL, -- 'categorization', 'pattern', 'user_style', 'research_method'
  what_learned TEXT NOT NULL, -- description of what Andy learned
  from_content TEXT NOT NULL, -- what user content triggered this learning
  source_id UUID, -- ID of memory/knowledge that triggered learning
  source_type TEXT, -- 'memory', 'knowledge', 'conversation'
  confidence NUMERIC DEFAULT 0.7,
  applied_count INT DEFAULT 0, -- how many times Andy has used this learning
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_andy_research_user ON andy_research(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_andy_research_type ON andy_research(user_id, research_type);
CREATE INDEX IF NOT EXISTS idx_andy_enhancements_user ON andy_memory_enhancements(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_andy_enhancements_source_memory ON andy_memory_enhancements(source_memory_id);
CREATE INDEX IF NOT EXISTS idx_andy_learning_user ON andy_learning_log(user_id, learned_at DESC);
CREATE INDEX IF NOT EXISTS idx_andy_learning_type ON andy_learning_log(user_id, learning_type);

-- RLS policies
ALTER TABLE andy_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE andy_memory_enhancements ENABLE ROW LEVEL SECURITY;
ALTER TABLE andy_learning_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their Andy research"
  ON andy_research FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their Andy enhancements"
  ON andy_memory_enhancements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their Andy learning log"
  ON andy_learning_log FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert/update
CREATE POLICY "Service can manage Andy research"
  ON andy_research FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service can manage Andy enhancements"
  ON andy_memory_enhancements FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service can manage Andy learning log"
  ON andy_learning_log FOR ALL
  USING (true)
  WITH CHECK (true);