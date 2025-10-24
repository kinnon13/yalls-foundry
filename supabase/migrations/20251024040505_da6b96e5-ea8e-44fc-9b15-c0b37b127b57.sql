-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Brain Tasks: High-level scheduled research/analysis tasks
CREATE TABLE brain_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  goal TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'complete', 'synthesized')),
  interval_seconds INT DEFAULT 0,
  total_iterations INT DEFAULT 1,
  current_iteration INT DEFAULT 0,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brain Iterations: Each perspective/angle pass
CREATE TABLE brain_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES brain_tasks(id) ON DELETE CASCADE,
  iteration_index INT NOT NULL,
  angle TEXT,
  source_set TEXT,
  summary TEXT,
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brain Insights: Final synthesized knowledge with embeddings
CREATE TABLE brain_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES brain_tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  full_text TEXT,
  key_points JSONB,
  embedding VECTOR(1536),
  memory_strength FLOAT DEFAULT 1.0 CHECK (memory_strength >= 0 AND memory_strength <= 1),
  decay_rate FLOAT DEFAULT 0.01,
  last_recalled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brain Reflections: Weekly self-analysis journal
CREATE TABLE brain_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date DATE DEFAULT CURRENT_DATE,
  summary TEXT,
  reinforced_count INT DEFAULT 0,
  decayed_count INT DEFAULT 0,
  new_insights INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_brain_tasks_next_run ON brain_tasks(next_run_at) WHERE status = 'scheduled';
CREATE INDEX idx_brain_tasks_user ON brain_tasks(user_id);
CREATE INDEX idx_brain_iterations_task ON brain_iterations(task_id);
CREATE INDEX idx_brain_insights_user ON brain_insights(user_id);
CREATE INDEX idx_brain_insights_strength ON brain_insights(memory_strength);
CREATE INDEX idx_brain_reflections_user_date ON brain_reflections(user_id, report_date DESC);

-- Vector similarity index for semantic search
CREATE INDEX brain_insights_embedding_idx ON brain_insights USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS Policies
ALTER TABLE brain_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks" ON brain_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own iterations" ON brain_iterations FOR SELECT USING (
  EXISTS (SELECT 1 FROM brain_tasks WHERE brain_tasks.id = brain_iterations.task_id AND brain_tasks.user_id = auth.uid())
);
CREATE POLICY "Users manage own insights" ON brain_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own reflections" ON brain_reflections FOR ALL USING (auth.uid() = user_id);

-- Function: Decay memory strength over time
CREATE OR REPLACE FUNCTION decay_brain_memory()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE brain_insights
  SET memory_strength = GREATEST(
    0,
    memory_strength - ((EXTRACT(EPOCH FROM (NOW() - COALESCE(last_recalled_at, created_at))) / 86400.0) * decay_rate)
  )
  WHERE memory_strength > 0;
END;
$$;

-- Function: Semantic similarity search
CREATE OR REPLACE FUNCTION match_brain_insights(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  task_id UUID,
  title TEXT,
  summary TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    brain_insights.id,
    brain_insights.task_id,
    brain_insights.title,
    brain_insights.summary,
    1 - (brain_insights.embedding <=> query_embedding) AS similarity
  FROM brain_insights
  WHERE 
    (filter_user_id IS NULL OR brain_insights.user_id = filter_user_id)
    AND brain_insights.embedding <=> query_embedding < 1 - match_threshold
  ORDER BY brain_insights.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Trigger: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brain_tasks_updated_at BEFORE UPDATE ON brain_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER brain_insights_updated_at BEFORE UPDATE ON brain_insights
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();