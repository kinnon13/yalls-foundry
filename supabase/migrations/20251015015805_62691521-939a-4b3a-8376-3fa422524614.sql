-- Super-admin private memory (your eyes only)
CREATE TABLE IF NOT EXISTS public.ai_admin_private_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  super_admin_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, super_admin_id, key)
);

-- Change proposals (confirm-before-commit)
CREATE TABLE IF NOT EXISTS public.ai_change_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  target_scope TEXT NOT NULL CHECK (target_scope IN ('user_memory','entity','global')),
  target_ref TEXT NOT NULL,
  change JSONB NOT NULL,
  requested_by UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  approvals_required INT DEFAULT 1,
  approvals_collected INT DEFAULT 0,
  approver_policy JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual confirmations
CREATE TABLE IF NOT EXISTS public.ai_change_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.ai_change_proposals(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL,
  approver_role TEXT NOT NULL CHECK (approver_role IN ('owner','rider','admin','super_admin')),
  decision TEXT NOT NULL CHECK (decision IN ('approve','reject')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (proposal_id, approver_id)
);

-- Proactive consent and settings
CREATE TABLE IF NOT EXISTS public.ai_user_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  proactive_enabled BOOLEAN DEFAULT false,
  scopes TEXT[] DEFAULT '{}',
  quiet_hours INT4RANGE,
  cadence TEXT DEFAULT 'balanced' CHECK (cadence IN ('low','balanced','high')),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- Hypothesis memory (proactive beliefs)
CREATE TABLE IF NOT EXISTS public.ai_hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','confirmed','rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, user_id, key)
);

-- Proactive triggers
CREATE TABLE IF NOT EXISTS public.ai_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('time','behavior','anomaly','opportunity')),
  matcher JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled proposals/questions/actions
CREATE TABLE IF NOT EXISTS public.ai_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('question','nudge','draft_action')),
  payload JSONB NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','sent','accepted','dismissed','expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Proactive dispatch log
CREATE TABLE IF NOT EXISTS public.ai_proactive_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  proposal_id UUID REFERENCES public.ai_proposals(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('inbox','push','email','sms')),
  result TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Policy rules for guardrails
CREATE TABLE IF NOT EXISTS public.ai_policy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  scope TEXT CHECK (scope IN ('input','output','tool','endpoint')) NOT NULL,
  matcher JSONB NOT NULL,
  action TEXT CHECK (action IN ('block','mask','warn','review')) NOT NULL,
  priority INT DEFAULT 100,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Blocklist for content safety
CREATE TABLE IF NOT EXISTS public.ai_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  pattern TEXT NOT NULL,
  target TEXT CHECK (target IN ('input','output')) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Model registry for AB testing
CREATE TABLE IF NOT EXISTS public.ai_model_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  default_params JSONB DEFAULT '{}',
  traffic_pct INT DEFAULT 0 CHECK (traffic_pct >= 0 AND traffic_pct <= 100),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session telemetry
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  actor_role TEXT CHECK (actor_role IN ('user','admin','system')) NOT NULL,
  model_id TEXT NOT NULL,
  params JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Feedback for training
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
  user_id UUID,
  kind TEXT CHECK (kind IN ('thumbs_up','thumbs_down','correction','label')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add provenance to existing user memory
ALTER TABLE public.ai_user_memory 
ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '[]'::jsonb;

-- Enable RLS on all new tables
ALTER TABLE public.ai_admin_private_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_change_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_user_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_proactive_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- ai_admin_private_memory: only super_admin_id owner can access
CREATE POLICY "Super admins can manage their private memory"
  ON public.ai_admin_private_memory
  FOR ALL
  USING (auth.uid() = super_admin_id AND has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = super_admin_id AND has_role(auth.uid(), 'admin'));

-- ai_change_proposals: users can view proposals they requested or can approve
CREATE POLICY "Users can view their own proposals"
  ON public.ai_change_proposals
  FOR SELECT
  USING (auth.uid() = requested_by);

CREATE POLICY "Admins can view all proposals"
  ON public.ai_change_proposals
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create proposals"
  ON public.ai_change_proposals
  FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Admins can update proposals"
  ON public.ai_change_proposals
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- ai_change_approvals: users can approve proposals where they're eligible
CREATE POLICY "Users can view approvals"
  ON public.ai_change_approvals
  FOR SELECT
  USING (auth.uid() = approver_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can add their approval"
  ON public.ai_change_approvals
  FOR INSERT
  WITH CHECK (auth.uid() = approver_id);

-- ai_user_consent: users manage their own consent
CREATE POLICY "Users can manage their consent"
  ON public.ai_user_consent
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view consent"
  ON public.ai_user_consent
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ai_hypotheses: users see their own, admins see all
CREATE POLICY "Users can view their hypotheses"
  ON public.ai_hypotheses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all hypotheses"
  ON public.ai_hypotheses
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage hypotheses"
  ON public.ai_hypotheses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ai_triggers: admins only
CREATE POLICY "Admins can manage triggers"
  ON public.ai_triggers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ai_proposals: users see their own
CREATE POLICY "Users can view their proposals"
  ON public.ai_proposals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage proposals"
  ON public.ai_proposals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ai_proactive_log: admins only
CREATE POLICY "Admins can view proactive log"
  ON public.ai_proactive_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ai_policy_rules: admins only
CREATE POLICY "Admins can manage policy rules"
  ON public.ai_policy_rules
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ai_blocklist: admins only
CREATE POLICY "Admins can manage blocklist"
  ON public.ai_blocklist
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ai_model_registry: admins only
CREATE POLICY "Admins can manage model registry"
  ON public.ai_model_registry
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ai_sessions: users see their own, admins see all
CREATE POLICY "Users can view their sessions"
  ON public.ai_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON public.ai_sessions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create sessions"
  ON public.ai_sessions
  FOR INSERT
  WITH CHECK (true);

-- ai_feedback: users can add feedback to their sessions
CREATE POLICY "Users can add feedback"
  ON public.ai_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their feedback"
  ON public.ai_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.ai_feedback
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_change_proposals_status ON public.ai_change_proposals(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_proposals_due ON public.ai_proposals(due_at, status);
CREATE INDEX IF NOT EXISTS idx_ai_hypotheses_user ON public.ai_hypotheses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON public.ai_sessions(user_id, started_at);

-- Insert default model configurations
INSERT INTO public.ai_model_registry (name, version, provider, model_id, traffic_pct, enabled) VALUES
  ('rocker-user', 'v1.0.0', 'openai', 'gpt-4o', 100, true),
  ('rocker-admin', 'v1.0.0', 'openai', 'gpt-4o', 100, true)
ON CONFLICT DO NOTHING;

-- Insert default triggers
INSERT INTO public.ai_triggers (tenant_id, name, kind, matcher, enabled) VALUES
  (gen_random_uuid(), 'event_stale', 'opportunity', '{"days_since_last_event": 21, "min_past_events": 1}'::jsonb, true),
  (gen_random_uuid(), 'papers_uploaded', 'behavior', '{"event_type": "registration_upload"}'::jsonb, true),
  (gen_random_uuid(), 'onboarding_gap', 'time', '{"hours_since_signup": 72, "profile_completion": 30}'::jsonb, true)
ON CONFLICT DO NOTHING;