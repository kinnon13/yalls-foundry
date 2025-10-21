-- =====================================================
-- Rocker Task OS: Kernel-like, fully dynamic task system
-- Designed to scale to billions of users
-- =====================================================

-- Core tasks table
CREATE TABLE IF NOT EXISTS rocker_tasks_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id uuid,
  project_id uuid,
  kind text NOT NULL CHECK (kind IN ('action','decision','research','content','meeting','bug','followup','analysis')) DEFAULT 'action',
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('inbox','triaged','planned','in_progress','review','blocked','done','archived')) DEFAULT 'inbox',
  priority text NOT NULL CHECK (priority IN ('urgent','high','normal','low')) DEFAULT 'normal',
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  sla_severity int DEFAULT 3 CHECK (sla_severity BETWEEN 1 AND 5),
  rice_reach numeric,
  rice_impact numeric,
  rice_confidence numeric,
  rice_effort numeric,
  assignee_type text CHECK (assignee_type IN ('user','rocker','contact','team')) DEFAULT 'rocker',
  assignee_id uuid,
  blocker_reason text,
  reopen_reason text,
  source text,
  source_ref text,
  metadata jsonb DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task subtasks/checklist
CREATE TABLE IF NOT EXISTS rocker_task_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES rocker_tasks_v2(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean DEFAULT false,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Task comments/notes
CREATE TABLE IF NOT EXISTS rocker_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES rocker_tasks_v2(id) ON DELETE CASCADE,
  author_type text CHECK (author_type IN ('user','rocker')) DEFAULT 'rocker',
  author_id uuid,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Task dependencies
CREATE TABLE IF NOT EXISTS rocker_task_dependencies (
  task_id uuid REFERENCES rocker_tasks_v2(id) ON DELETE CASCADE,
  depends_on uuid REFERENCES rocker_tasks_v2(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on)
);

-- Dynamic task labels
CREATE TABLE IF NOT EXISTS rocker_task_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, name)
);

-- Task label links (many-to-many)
CREATE TABLE IF NOT EXISTS rocker_task_label_links (
  task_id uuid REFERENCES rocker_tasks_v2(id) ON DELETE CASCADE,
  label_id uuid REFERENCES rocker_task_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- Dynamic projects
CREATE TABLE IF NOT EXISTS rocker_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id uuid,
  title text NOT NULL,
  description text,
  status text CHECK (status IN ('active','paused','done','archived')) DEFAULT 'active',
  start_at timestamptz,
  end_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- OKRs (Objectives and Key Results)
CREATE TABLE IF NOT EXISTS rocker_okrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id uuid,
  period text NOT NULL,
  objective text NOT NULL,
  confidence int DEFAULT 70 CHECK (confidence BETWEEN 0 AND 100),
  status text CHECK (status IN ('active','paused','completed','abandoned')) DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Key Results for OKRs
CREATE TABLE IF NOT EXISTS rocker_okr_key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id uuid NOT NULL REFERENCES rocker_okrs(id) ON DELETE CASCADE,
  name text NOT NULL,
  target numeric NOT NULL,
  current numeric DEFAULT 0,
  unit text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task progress snapshots (for analytics/learning)
CREATE TABLE IF NOT EXISTS rocker_task_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES rocker_tasks_v2(id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  confidence numeric CHECK (confidence BETWEEN 0 AND 1),
  metadata jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT now()
);

-- Indexes for performance at scale
CREATE INDEX IF NOT EXISTS idx_tasks_v2_owner ON rocker_tasks_v2(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_v2_status ON rocker_tasks_v2(status);
CREATE INDEX IF NOT EXISTS idx_tasks_v2_due_at ON rocker_tasks_v2(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_v2_priority ON rocker_tasks_v2(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_v2_entity ON rocker_tasks_v2(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_v2_project ON rocker_tasks_v2(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_v2_assignee ON rocker_tasks_v2(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_v2_embedding ON rocker_tasks_v2 USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_subtasks_task ON rocker_task_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_task ON rocker_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON rocker_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_okrs_owner ON rocker_okrs(owner_id);
CREATE INDEX IF NOT EXISTS idx_labels_owner ON rocker_task_labels(owner_id);

-- RLS Policies (secure, scalable)
ALTER TABLE rocker_tasks_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_task_label_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_okr_key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_task_progress ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "tasks_v2_owner_all" ON rocker_tasks_v2
  FOR ALL USING (owner_id = auth.uid());

-- Subtasks policies
CREATE POLICY "subtasks_owner_all" ON rocker_task_subtasks
  FOR ALL USING (
    task_id IN (SELECT id FROM rocker_tasks_v2 WHERE owner_id = auth.uid())
  );

-- Comments policies
CREATE POLICY "comments_owner_all" ON rocker_task_comments
  FOR ALL USING (
    task_id IN (SELECT id FROM rocker_tasks_v2 WHERE owner_id = auth.uid())
  );

-- Dependencies policies
CREATE POLICY "deps_owner_all" ON rocker_task_dependencies
  FOR ALL USING (
    task_id IN (SELECT id FROM rocker_tasks_v2 WHERE owner_id = auth.uid())
  );

-- Labels policies
CREATE POLICY "labels_owner_all" ON rocker_task_labels
  FOR ALL USING (owner_id = auth.uid());

-- Label links policies
CREATE POLICY "label_links_owner_all" ON rocker_task_label_links
  FOR ALL USING (
    task_id IN (SELECT id FROM rocker_tasks_v2 WHERE owner_id = auth.uid())
  );

-- Projects policies
CREATE POLICY "projects_owner_all" ON rocker_projects
  FOR ALL USING (owner_id = auth.uid());

-- OKRs policies
CREATE POLICY "okrs_owner_all" ON rocker_okrs
  FOR ALL USING (owner_id = auth.uid());

-- Key results policies
CREATE POLICY "key_results_owner_all" ON rocker_okr_key_results
  FOR ALL USING (
    okr_id IN (SELECT id FROM rocker_okrs WHERE owner_id = auth.uid())
  );

-- Progress policies
CREATE POLICY "progress_owner_all" ON rocker_task_progress
  FOR ALL USING (
    task_id IN (SELECT id FROM rocker_tasks_v2 WHERE owner_id = auth.uid())
  );

-- Function: Vector search for tasks (for AI triage/recall)
CREATE OR REPLACE FUNCTION ai_search_tasks(
  p_user_id uuid,
  p_query_embedding vector(1536),
  p_match_threshold float DEFAULT 0.6,
  p_match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status text,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.status,
    1 - (t.embedding <=> p_query_embedding) as similarity
  FROM rocker_tasks_v2 t
  WHERE t.owner_id = p_user_id
    AND t.embedding IS NOT NULL
    AND 1 - (t.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY t.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- Function: Calculate task RICE score
CREATE OR REPLACE FUNCTION calculate_rice_score(
  reach numeric,
  impact numeric,
  confidence numeric,
  effort numeric
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF effort = 0 OR effort IS NULL THEN
    RETURN 0;
  END IF;
  RETURN (reach * impact * confidence) / effort;
END;
$$;

-- Function: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for auto-updating timestamps
CREATE TRIGGER tasks_v2_updated_at
  BEFORE UPDATE ON rocker_tasks_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON rocker_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER okrs_updated_at
  BEFORE UPDATE ON rocker_okrs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER key_results_updated_at
  BEFORE UPDATE ON rocker_okr_key_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function: Track task status changes
CREATE OR REPLACE FUNCTION track_task_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO rocker_task_progress (task_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_v2_status_change
  AFTER UPDATE ON rocker_tasks_v2
  FOR EACH ROW
  EXECUTE FUNCTION track_task_status_change();