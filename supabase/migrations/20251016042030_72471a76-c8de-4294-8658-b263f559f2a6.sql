-- Promotion Queue System for hierarchical knowledge flow
CREATE TABLE IF NOT EXISTS ai_promotion_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_scope TEXT NOT NULL CHECK (from_scope IN ('user','admin')),
  to_scope TEXT NOT NULL CHECK (to_scope IN ('admin','andy')),
  proposer_id UUID NOT NULL,
  source_ref JSONB NOT NULL,
  payload JSONB NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','applied')),
  approver_id UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promotion_queue_status ON ai_promotion_queue(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promotion_queue_proposer ON ai_promotion_queue(proposer_id);

-- Promotion Audit Trail
CREATE TABLE IF NOT EXISTS ai_promotion_audit (
  id BIGSERIAL PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES ai_promotion_queue(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('submit','approve','reject','apply')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotion_audit_promotion ON ai_promotion_audit(promotion_id, created_at DESC);

-- Inter-Rocker Messaging System
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_actor TEXT NOT NULL CHECK (from_actor IN ('user','admin','knower')),
  to_actor TEXT NOT NULL CHECK (to_actor IN ('user','admin','knower')),
  from_user_id UUID,
  to_user_id UUID,
  correlation_id TEXT,
  subject TEXT,
  body JSONB NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  tenant_id UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_to ON ai_messages(to_actor, to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_correlation ON ai_messages(correlation_id);

-- Andy Conversation Access Log (for audit)
CREATE TABLE IF NOT EXISTS ai_knower_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  accessed_user_id UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view_profile','view_conversations','view_memories')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knower_access_user ON ai_knower_access_log(accessed_user_id, created_at DESC);

-- RLS Policies

-- Promotion Queue
ALTER TABLE ai_promotion_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own proposals" ON ai_promotion_queue
  FOR SELECT USING (auth.uid() = proposer_id);

CREATE POLICY "Admins can view all proposals" ON ai_promotion_queue
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can create proposals" ON ai_promotion_queue
  FOR INSERT WITH CHECK (auth.uid() = proposer_id);

CREATE POLICY "Admins can update proposals" ON ai_promotion_queue
  FOR UPDATE USING (is_admin(auth.uid()));

-- Promotion Audit
ALTER TABLE ai_promotion_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit trail" ON ai_promotion_audit
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert audit records" ON ai_promotion_audit
  FOR INSERT WITH CHECK (true);

-- AI Messages
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON ai_messages
  FOR SELECT USING (
    (from_user_id = auth.uid()) OR 
    (to_user_id = auth.uid()) OR 
    is_admin(auth.uid())
  );

CREATE POLICY "System can create messages" ON ai_messages
  FOR INSERT WITH CHECK (true);

-- Knower Access Log
ALTER TABLE ai_knower_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access logs" ON ai_knower_access_log
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can log access" ON ai_knower_access_log
  FOR INSERT WITH CHECK (true);

-- Helper Functions

-- Propose promotion
CREATE OR REPLACE FUNCTION ai_propose(
  p_from TEXT,
  p_to TEXT,
  p_proposer UUID,
  p_source JSONB,
  p_payload JSONB,
  p_reason TEXT,
  p_tenant UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  v_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO ai_promotion_queue(id, from_scope, to_scope, proposer_id, source_ref, payload, reason, tenant_id)
  VALUES (v_id, p_from, p_to, p_proposer, p_source, p_payload, p_reason, p_tenant);
  
  INSERT INTO ai_promotion_audit(promotion_id, actor_id, action, notes)
  VALUES (v_id, p_proposer, 'submit', COALESCE(p_reason, ''));
  
  RETURN v_id;
END $$;

-- Approve/reject promotion
CREATE OR REPLACE FUNCTION ai_approve(
  p_id UUID,
  p_admin UUID,
  p_decision TEXT,
  p_notes TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE ai_promotion_queue
  SET status = CASE WHEN p_decision = 'approve' THEN 'approved' ELSE 'rejected' END,
      approver_id = p_admin,
      reviewed_at = now()
  WHERE id = p_id;
  
  INSERT INTO ai_promotion_audit(promotion_id, actor_id, action, notes)
  VALUES (p_id, p_admin, p_decision, COALESCE(p_notes, ''));
END $$;