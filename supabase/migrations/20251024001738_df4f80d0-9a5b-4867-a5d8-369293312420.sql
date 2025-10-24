-- Super Andy Continuous Learning Tables

-- External learning knowledge (web research, APIs, etc.)
CREATE TABLE IF NOT EXISTS public.andy_external_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  learned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Internal learning knowledge (platform analytics)
CREATE TABLE IF NOT EXISTS public.andy_internal_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_type TEXT NOT NULL,
  patterns_detected JSONB DEFAULT '[]'::jsonb,
  success_metrics JSONB DEFAULT '{}'::jsonb,
  optimizations JSONB DEFAULT '[]'::jsonb,
  learned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Learning metrics tracking
CREATE TABLE IF NOT EXISTS public.ai_learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent TEXT NOT NULL,
  cycle_type TEXT NOT NULL CHECK (cycle_type IN ('external', 'internal')),
  topics_researched INT DEFAULT 0,
  insights_captured INT DEFAULT 0,
  events_analyzed INT DEFAULT 0,
  patterns_found INT DEFAULT 0,
  optimizations_applied INT DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optimization queue
CREATE TABLE IF NOT EXISTS public.ai_optimization_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'failed')),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_andy_external_topic ON public.andy_external_knowledge(topic);
CREATE INDEX IF NOT EXISTS idx_andy_external_learned_at ON public.andy_external_knowledge(learned_at DESC);
CREATE INDEX IF NOT EXISTS idx_andy_internal_type ON public.andy_internal_knowledge(learning_type);
CREATE INDEX IF NOT EXISTS idx_andy_internal_learned_at ON public.andy_internal_knowledge(learned_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_metrics_agent ON public.ai_learning_metrics(agent, cycle_type, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_status ON public.ai_optimization_queue(status, priority);

-- Enable RLS
ALTER TABLE public.andy_external_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.andy_internal_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_optimization_queue ENABLE ROW LEVEL SECURITY;

-- Service role (edge functions) has full access
CREATE POLICY service_role_all_andy_external ON public.andy_external_knowledge FOR ALL TO service_role USING (true);
CREATE POLICY service_role_all_andy_internal ON public.andy_internal_knowledge FOR ALL TO service_role USING (true);
CREATE POLICY service_role_all_learning_metrics ON public.ai_learning_metrics FOR ALL TO service_role USING (true);
CREATE POLICY service_role_all_optimization ON public.ai_optimization_queue FOR ALL TO service_role USING (true);

-- Authenticated users can view (read-only)
CREATE POLICY authenticated_read_andy_external ON public.andy_external_knowledge FOR SELECT TO authenticated USING (true);
CREATE POLICY authenticated_read_andy_internal ON public.andy_internal_knowledge FOR SELECT TO authenticated USING (true);
CREATE POLICY authenticated_read_learning_metrics ON public.ai_learning_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY authenticated_read_optimization ON public.ai_optimization_queue FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE public.andy_external_knowledge IS 'Super Andy external learning: web research, AI insights, global knowledge';
COMMENT ON TABLE public.andy_internal_knowledge IS 'Super Andy internal learning: platform analytics, pattern detection, optimizations';
COMMENT ON TABLE public.ai_learning_metrics IS 'Metrics for continuous learning cycles';
COMMENT ON TABLE public.ai_optimization_queue IS 'Queue for automated platform optimizations discovered by Super Andy';
