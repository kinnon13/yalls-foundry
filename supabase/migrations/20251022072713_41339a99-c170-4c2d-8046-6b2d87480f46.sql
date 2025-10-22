-- User feedback & learnings captured from UI ("Rate this")
CREATE TABLE IF NOT EXISTS public.ai_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  conversation_id uuid,
  ledger_id uuid,
  correlation_id text,
  source text NOT NULL DEFAULT 'why_panel',
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  comment text,
  tags text[] DEFAULT '{}',
  model_name text,
  prompt_hash text,
  policy_version text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_learnings_conv_idx
  ON public.ai_learnings(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_learnings_corr_idx
  ON public.ai_learnings(correlation_id);

-- RLS
ALTER TABLE public.ai_learnings ENABLE ROW LEVEL SECURITY;

-- service role (edge functions) full access
DROP POLICY IF EXISTS service_role_all_learnings ON public.ai_learnings;
CREATE POLICY service_role_all_learnings
  ON public.ai_learnings
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);