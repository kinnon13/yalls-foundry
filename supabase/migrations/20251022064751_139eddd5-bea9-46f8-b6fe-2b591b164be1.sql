-- P7: Safety & Autonomy Schema
-- Dry-run, canary, rollback interlocks

CREATE TABLE IF NOT EXISTS ai_change_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  topic text NOT NULL,
  dry_run jsonb,
  canary jsonb,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'dry_run', 'canary', 'committed', 'rolled_back')),
  risk_score int CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  committed_at timestamptz,
  rolled_back_at timestamptz
);

CREATE TABLE IF NOT EXISTS ai_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source text NOT NULL,
  summary text NOT NULL,
  detail jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS ai_change_proposals_status_idx ON ai_change_proposals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_incidents_severity_idx ON ai_incidents(severity, created_at DESC) WHERE resolved_at IS NULL;

-- RLS
ALTER TABLE ai_change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to change_proposals"
  ON ai_change_proposals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access to incidents"
  ON ai_incidents FOR ALL TO service_role USING (true) WITH CHECK (true);