-- Term knowledge & web lookup verification system
CREATE TABLE IF NOT EXISTS term_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('user','web')) NOT NULL,
  source_url TEXT,
  title TEXT,
  summary TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  supersedes UUID REFERENCES term_knowledge(id),
  is_active BOOLEAN DEFAULT true,
  confidence_score NUMERIC DEFAULT 0.5
);

CREATE INDEX idx_term_knowledge_term ON term_knowledge(term);
CREATE INDEX idx_term_knowledge_active ON term_knowledge(is_active) WHERE is_active = true;

-- Peer verification votes
CREATE TABLE IF NOT EXISTS term_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_knowledge_id UUID REFERENCES term_knowledge(id) ON DELETE CASCADE,
  voter_user_id UUID NOT NULL,
  vote SMALLINT CHECK (vote IN (-1, 1)) NOT NULL,
  confidence SMALLINT CHECK (confidence BETWEEN 1 AND 5) DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(term_knowledge_id, voter_user_id)
);

CREATE INDEX idx_term_votes_knowledge ON term_votes(term_knowledge_id);

-- Term resolution tracking
CREATE TABLE IF NOT EXISTS term_resolution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  term TEXT NOT NULL,
  term_knowledge_id UUID REFERENCES term_knowledge(id),
  method TEXT CHECK (method IN ('clarify','web','user_edit')) NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_term_resolution_user ON term_resolution_events(user_id);
CREATE INDEX idx_term_resolution_term ON term_resolution_events(term);

-- Visual learning events (when user shows/corrects via screen)
CREATE TABLE IF NOT EXISTS visual_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID,
  action_attempted TEXT NOT NULL,
  correction_type TEXT CHECK (correction_type IN ('click_shown','type_shown','navigate_shown','other')) NOT NULL,
  user_feedback TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_visual_learning_user ON visual_learning_events(user_id);
CREATE INDEX idx_visual_learning_session ON visual_learning_events(session_id);

-- AI interaction tracking (comprehensive pass/fail)
CREATE TABLE IF NOT EXISTS ai_interaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID,
  interaction_type TEXT NOT NULL,
  intent TEXT NOT NULL,
  tool_called TEXT,
  parameters JSONB,
  result_status TEXT CHECK (result_status IN ('success','failure','partial')) NOT NULL,
  error_message TEXT,
  user_correction TEXT,
  improvement_applied BOOLEAN DEFAULT false,
  business_context JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_interaction_user ON ai_interaction_log(user_id);
CREATE INDEX idx_ai_interaction_status ON ai_interaction_log(result_status);
CREATE INDEX idx_ai_interaction_tool ON ai_interaction_log(tool_called);
CREATE INDEX idx_ai_interaction_date ON ai_interaction_log(created_at DESC);

-- Business KPIs tracking
CREATE TABLE IF NOT EXISTS business_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID,
  snapshot_date DATE NOT NULL,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  engagement_score NUMERIC DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  ai_interactions INTEGER DEFAULT 0,
  ai_success_rate NUMERIC DEFAULT 0,
  trends JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, snapshot_date)
);

CREATE INDEX idx_kpi_business ON business_kpi_snapshots(business_id);
CREATE INDEX idx_kpi_date ON business_kpi_snapshots(snapshot_date DESC);

-- RLS Policies
ALTER TABLE term_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_resolution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_kpi_snapshots ENABLE ROW LEVEL SECURITY;

-- term_knowledge policies
CREATE POLICY "Anyone can view active term knowledge"
  ON term_knowledge FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can add term knowledge"
  ON term_knowledge FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Admins can manage all term knowledge"
  ON term_knowledge FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- term_votes policies
CREATE POLICY "Users can vote on terms"
  ON term_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = voter_user_id);

CREATE POLICY "Users can view term votes"
  ON term_votes FOR SELECT
  TO authenticated
  USING (true);

-- term_resolution_events policies
CREATE POLICY "Users can view their resolution events"
  ON term_resolution_events FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert resolution events"
  ON term_resolution_events FOR INSERT
  WITH CHECK (true);

-- visual_learning_events policies
CREATE POLICY "Users can view their visual learning"
  ON visual_learning_events FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert visual learning"
  ON visual_learning_events FOR INSERT
  WITH CHECK (true);

-- ai_interaction_log policies
CREATE POLICY "Users can view their interactions"
  ON ai_interaction_log FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System can log interactions"
  ON ai_interaction_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update interactions"
  ON ai_interaction_log FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- business_kpi_snapshots policies
CREATE POLICY "Business owners can view their KPIs"
  ON business_kpi_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_kpi_snapshots.business_id 
      AND businesses.owner_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can insert KPI snapshots"
  ON business_kpi_snapshots FOR INSERT
  WITH CHECK (true);