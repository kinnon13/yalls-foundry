-- Add role-based scoping for Rocker conversations and memories

-- 1) Add actor_role to rocker_conversations
ALTER TABLE public.rocker_conversations
  ADD COLUMN IF NOT EXISTS actor_role TEXT
  CHECK (actor_role IN ('user','admin'))
  DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_rocker_conversations_role
  ON public.rocker_conversations (user_id, actor_role, created_at DESC);

-- 2) Add scope to ai_user_memory
ALTER TABLE public.ai_user_memory
  ADD COLUMN IF NOT EXISTS scope TEXT
  CHECK (scope IN ('user','admin'))
  DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_ai_user_memory_scope
  ON public.ai_user_memory (user_id, namespace, scope);

-- 3) Create admin_audit table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_audit (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id
  ON public.admin_audit (admin_id, created_at DESC);

-- Enable RLS on admin_audit
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON public.admin_audit
  FOR INSERT
  WITH CHECK (true);