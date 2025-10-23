-- Create comprehensive monitoring table for Andy (no role dependency)
CREATE TABLE IF NOT EXISTS public.ai_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  user_id UUID,
  request_type TEXT,
  status TEXT CHECK (status IN ('success', 'failed', 'pending')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  context_size INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_monitoring_function ON public.ai_monitoring(function_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_monitoring_user ON public.ai_monitoring(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_monitoring_status ON public.ai_monitoring(status, created_at DESC);

ALTER TABLE public.ai_monitoring ENABLE ROW LEVEL SECURITY;

-- Users can see their own monitoring
CREATE POLICY "Users view own monitoring"
  ON public.ai_monitoring FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert
CREATE POLICY "Service role insert monitoring"
  ON public.ai_monitoring FOR INSERT
  WITH CHECK (true);
