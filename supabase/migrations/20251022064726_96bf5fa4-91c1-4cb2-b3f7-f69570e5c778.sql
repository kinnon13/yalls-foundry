-- P6: Multi-Dimensional Reasoning (MDR) Schema
-- Enables multi-perspective planning and consensus

CREATE TABLE IF NOT EXISTS ai_perspectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  task_id text NOT NULL,
  perspective_name text NOT NULL,
  approach text NOT NULL,
  rationale text,
  confidence_score int CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_plan_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  task_id text NOT NULL,
  perspective_id uuid REFERENCES ai_perspectives(id),
  plan_description text NOT NULL,
  steps jsonb,
  estimated_cost_cents int,
  estimated_duration_ms bigint,
  risk_score int CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_consensus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  task_id text NOT NULL,
  chosen_plan_id uuid REFERENCES ai_plan_candidates(id),
  confidence int CHECK (confidence >= 0 AND confidence <= 100),
  reasoning text,
  alternatives jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_hypotheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  hypothesis text NOT NULL,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'testing', 'validated', 'rejected')),
  evidence_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  hypothesis_id uuid REFERENCES ai_hypotheses(id),
  evidence_type text NOT NULL,
  data jsonb NOT NULL,
  weight int DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_decision_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  policy_name text NOT NULL,
  min_confidence int DEFAULT 70,
  require_consensus boolean DEFAULT true,
  max_cost_cents int,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for MDR
CREATE INDEX IF NOT EXISTS ai_perspectives_task_idx ON ai_perspectives(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_plan_candidates_task_idx ON ai_plan_candidates(task_id, risk_score);
CREATE INDEX IF NOT EXISTS ai_consensus_task_idx ON ai_consensus(task_id);

-- RLS for MDR tables
ALTER TABLE ai_perspectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_plan_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consensus ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_policy ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY "Service role full access to perspectives"
  ON ai_perspectives FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to plan_candidates"
  ON ai_plan_candidates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to consensus"
  ON ai_consensus FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to hypotheses"
  ON ai_hypotheses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to evidence"
  ON ai_evidence FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to decision_policy"
  ON ai_decision_policy FOR ALL TO service_role USING (true) WITH CHECK (true);