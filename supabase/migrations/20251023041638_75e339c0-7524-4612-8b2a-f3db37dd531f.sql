-- Add tenant_id to all AI tables and enable RLS with tenant isolation

-- 1. ai_action_ledger
ALTER TABLE ai_action_ledger ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE ai_action_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_ledger_select" ON ai_action_ledger 
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_isolation_ledger_insert" ON ai_action_ledger 
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- 2. ai_user_consent
ALTER TABLE ai_user_consent ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE ai_user_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_consent_select" ON ai_user_consent 
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_isolation_consent_insert" ON ai_user_consent 
  FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "tenant_isolation_consent_update" ON ai_user_consent 
  FOR UPDATE USING (tenant_id = auth.uid());

-- 3. ai_feedback
ALTER TABLE ai_feedback ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_feedback_select" ON ai_feedback 
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_isolation_feedback_insert" ON ai_feedback 
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- 4. ai_events
ALTER TABLE ai_events ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;

-- Service role can manage all events, users can only see their own
CREATE POLICY "service_role_all_events" ON ai_events 
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "tenant_isolation_events_select" ON ai_events 
  FOR SELECT USING (tenant_id = auth.uid());

-- 5. ai_incidents
ALTER TABLE ai_incidents ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE ai_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_incidents" ON ai_incidents 
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 6. ai_worker_heartbeats
ALTER TABLE ai_worker_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_heartbeats" ON ai_worker_heartbeats 
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 7. ai_job_dlq
ALTER TABLE ai_job_dlq ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE ai_job_dlq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_dlq" ON ai_job_dlq 
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 8. ai_change_proposals
ALTER TABLE ai_change_proposals ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE ai_change_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_proposals" ON ai_change_proposals 
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 9. ai_self_improve_log
ALTER TABLE ai_self_improve_log ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE ai_self_improve_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_improve_log" ON ai_self_improve_log 
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 10. ai_ethics_policy
ALTER TABLE ai_ethics_policy ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE ai_ethics_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_ethics_select" ON ai_ethics_policy 
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "tenant_isolation_ethics_insert" ON ai_ethics_policy 
  FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "tenant_isolation_ethics_update" ON ai_ethics_policy 
  FOR UPDATE USING (tenant_id = auth.uid());