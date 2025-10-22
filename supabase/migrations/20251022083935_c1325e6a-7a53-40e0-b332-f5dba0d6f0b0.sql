-- Best+10% Tables: Model budget, routing, ethics, proactive suggestions, etc.

-- Model Budget Tracking
CREATE TABLE IF NOT EXISTS ai_model_budget (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  model_name text NOT NULL,
  monthly_limit_usd numeric NOT NULL DEFAULT 100,
  spent_usd numeric NOT NULL DEFAULT 0,
  tokens_in bigint NOT NULL DEFAULT 0,
  tokens_out bigint NOT NULL DEFAULT 0,
  month text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, model_name, month)
);

ALTER TABLE ai_model_budget ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON ai_model_budget FOR ALL USING (true);

-- Model Routing Rules
CREATE TABLE IF NOT EXISTS ai_model_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  task_class text NOT NULL,
  model_name text NOT NULL,
  priority int NOT NULL DEFAULT 0,
  conditions jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_model_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON ai_model_routes FOR ALL USING (true);

-- Ethics Policy Config
CREATE TABLE IF NOT EXISTS ai_ethics_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  policy_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, policy_key)
);

ALTER TABLE ai_ethics_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON ai_ethics_policy FOR ALL USING (true);

-- Proactive Suggestions
CREATE TABLE IF NOT EXISTS ai_proactive_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  suggestion_type text NOT NULL,
  title text NOT NULL,
  description text,
  confidence numeric NOT NULL DEFAULT 0.5,
  executed boolean NOT NULL DEFAULT false,
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz,
  dismissed_at timestamptz
);

ALTER TABLE ai_proactive_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own suggestions" ON ai_proactive_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role access" ON ai_proactive_suggestions FOR ALL USING (true);

-- Sub-Agent Runs
CREATE TABLE IF NOT EXISTS ai_subagent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_job_id uuid,
  subagent text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  input jsonb DEFAULT '{}',
  output jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE ai_subagent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON ai_subagent_runs FOR ALL USING (true);

-- Self-Improvement Log
CREATE TABLE IF NOT EXISTS ai_self_improve_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name text NOT NULL,
  variant text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  context jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_self_improve_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON ai_self_improve_log FOR ALL USING (true);

-- World Models
CREATE TABLE IF NOT EXISTS ai_world_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  model_type text NOT NULL,
  model_data jsonb NOT NULL DEFAULT '{}',
  confidence numeric NOT NULL DEFAULT 0.5,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, model_type)
);

ALTER TABLE ai_world_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON ai_world_models FOR ALL USING (true);

-- Aggregated Learnings (for k-anon federation)
CREATE TABLE IF NOT EXISTS ai_learnings_agg (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agg_key text NOT NULL,
  count int NOT NULL DEFAULT 0,
  avg_rating numeric,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agg_key)
);

ALTER TABLE ai_learnings_agg ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON ai_learnings_agg FOR ALL USING (true);

-- Federation Flags
CREATE TABLE IF NOT EXISTS ai_federation_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE,
  opt_in boolean NOT NULL DEFAULT false,
  k_anon_min int NOT NULL DEFAULT 5,
  share_patterns boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_federation_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON ai_federation_flags FOR ALL USING (true);

-- Daily Reports
CREATE TABLE IF NOT EXISTS ai_daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  report_date date NOT NULL DEFAULT current_date,
  metrics jsonb NOT NULL DEFAULT '{}',
  insights text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, report_date)
);

ALTER TABLE ai_daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON ai_daily_reports FOR ALL USING (true);

-- RPC: Aggregate learnings for k-anon
CREATE OR REPLACE FUNCTION aggregate_learnings_k_anon(k_min int DEFAULT 5)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO ai_learnings_agg (agg_key, count, avg_rating, tags)
  SELECT
    concat_ws(':', COALESCE(input_summary, 'unknown'), COALESCE(reply_summary, 'unknown')),
    count(*),
    avg(rating),
    array_agg(DISTINCT t) FILTER (WHERE t IS NOT NULL)
  FROM ai_learnings
  CROSS JOIN LATERAL unnest(tags) AS t
  GROUP BY input_summary, reply_summary
  HAVING count(*) >= k_min
  ON CONFLICT (agg_key) DO UPDATE
  SET count = EXCLUDED.count,
      avg_rating = EXCLUDED.avg_rating,
      tags = EXCLUDED.tags,
      updated_at = now();
END;
$$;

-- RPC: Get distinct tenants with active goals
CREATE OR REPLACE FUNCTION distinct_tenants_with_active_goals()
RETURNS TABLE(tenant_id uuid, goal_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ag.tenant_id, count(*) as goal_count
  FROM ai_goals ag
  WHERE ag.status = 'active'
  GROUP BY ag.tenant_id;
END;
$$;

-- Seed default ethics policies
INSERT INTO ai_ethics_policy (tenant_id, policy_key, enabled, config)
SELECT gen_random_uuid(), 'harm_check', true, '{"threshold": 0.8}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_ethics_policy WHERE policy_key = 'harm_check');

INSERT INTO ai_ethics_policy (tenant_id, policy_key, enabled, config)
SELECT gen_random_uuid(), 'pii_redaction', true, '{"auto": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_ethics_policy WHERE policy_key = 'pii_redaction');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_model_budget_tenant ON ai_model_budget(tenant_id, month);
CREATE INDEX IF NOT EXISTS idx_model_routes_tenant ON ai_model_routes(tenant_id, task_class);
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_user ON ai_proactive_suggestions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subagent_runs_parent ON ai_subagent_runs(parent_job_id);
CREATE INDEX IF NOT EXISTS idx_self_improve_exp ON ai_self_improve_log(experiment_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_world_models_tenant ON ai_world_models(tenant_id, model_type);
CREATE INDEX IF NOT EXISTS idx_daily_reports_tenant ON ai_daily_reports(tenant_id, report_date DESC);