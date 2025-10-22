-- P2: AI Event Bus Schema
-- Enables webhook-lite pattern: vendors insert events, workers consume

CREATE TABLE IF NOT EXISTS ai_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  region text NOT NULL DEFAULT 'us',
  topic text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'done', 'error')),
  payload jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient polling and querying
CREATE INDEX IF NOT EXISTS ai_events_status_idx ON ai_events(status, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_events_tenant_topic_idx ON ai_events(tenant_id, topic, status);

-- RLS: Tenant-scoped access
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are tenant-scoped"
  ON ai_events
  FOR ALL
  USING (tenant_id::text = current_setting('app.tenant_id', true));

-- Service role bypass
CREATE POLICY "Service role full access to events"
  ON ai_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);