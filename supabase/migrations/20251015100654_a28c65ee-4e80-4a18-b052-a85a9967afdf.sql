-- Add cross-user learning and analytics tables

-- Table to track aggregated patterns across users
CREATE TABLE IF NOT EXISTS public.ai_global_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_key TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  success_rate NUMERIC DEFAULT 0.0,
  avg_confidence NUMERIC DEFAULT 0.0,
  user_count INTEGER DEFAULT 0,
  last_observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pattern_key, pattern_type)
);

-- Enable RLS
ALTER TABLE public.ai_global_patterns ENABLE ROW LEVEL SECURITY;

-- Everyone can read global patterns (for learning from others)
CREATE POLICY "Everyone can read global patterns"
  ON public.ai_global_patterns
  FOR SELECT
  USING (true);

-- System can manage patterns
CREATE POLICY "System can manage patterns"
  ON public.ai_global_patterns
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add indexes
CREATE INDEX idx_global_patterns_type_success 
  ON public.ai_global_patterns(pattern_type, success_rate DESC);

CREATE INDEX idx_global_patterns_observed 
  ON public.ai_global_patterns(last_observed_at DESC);

-- Table for user comparison metrics
CREATE TABLE IF NOT EXISTS public.ai_user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  percentile NUMERIC,
  compared_to INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.ai_user_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view their own analytics
CREATE POLICY "Users can view their own analytics"
  ON public.ai_user_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
  ON public.ai_user_analytics
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- System can manage analytics
CREATE POLICY "System can manage analytics"
  ON public.ai_user_analytics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add indexes
CREATE INDEX idx_user_analytics_user_metric 
  ON public.ai_user_analytics(user_id, metric_type, calculated_at DESC);

-- Function to aggregate user patterns into global patterns
CREATE OR REPLACE FUNCTION aggregate_user_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Aggregate common patterns from user memories
  INSERT INTO ai_global_patterns (pattern_key, pattern_type, occurrence_count, user_count, last_observed_at, metadata)
  SELECT 
    key,
    type::text,
    COUNT(*) as occurrence_count,
    COUNT(DISTINCT user_id) as user_count,
    MAX(updated_at) as last_observed_at,
    jsonb_build_object(
      'avg_confidence', AVG(confidence),
      'common_tags', jsonb_agg(DISTINCT tags)
    ) as metadata
  FROM ai_user_memory
  WHERE confidence >= 0.7
  GROUP BY key, type
  HAVING COUNT(DISTINCT user_id) >= 2
  ON CONFLICT (pattern_key, pattern_type) 
  DO UPDATE SET
    occurrence_count = EXCLUDED.occurrence_count,
    user_count = EXCLUDED.user_count,
    last_observed_at = EXCLUDED.last_observed_at,
    metadata = EXCLUDED.metadata;
END;
$$;

-- Function to calculate user percentiles
CREATE OR REPLACE FUNCTION calculate_user_percentiles(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users INTEGER;
  user_memory_count INTEGER;
  user_interaction_count INTEGER;
  user_success_rate NUMERIC;
BEGIN
  -- Get total active users
  SELECT COUNT(DISTINCT user_id) INTO total_users
  FROM ai_user_memory
  WHERE updated_at > NOW() - INTERVAL '30 days';

  -- Get user's memory count
  SELECT COUNT(*) INTO user_memory_count
  FROM ai_user_memory
  WHERE user_id = target_user_id;

  -- Get user's interaction count
  SELECT COUNT(*) INTO user_interaction_count
  FROM rocker_conversations
  WHERE user_id = target_user_id;

  -- Calculate success rate from feedback
  SELECT 
    COALESCE(
      SUM(CASE WHEN kind IN ('dom_success', 'positive') THEN 1 ELSE 0 END)::NUMERIC / 
      NULLIF(COUNT(*), 0),
      0
    ) INTO user_success_rate
  FROM ai_feedback
  WHERE user_id = target_user_id
    AND created_at > NOW() - INTERVAL '7 days';

  -- Insert analytics
  INSERT INTO ai_user_analytics (user_id, metric_type, metric_value, compared_to, calculated_at)
  VALUES 
    (target_user_id, 'memory_count', user_memory_count, total_users, NOW()),
    (target_user_id, 'interaction_count', user_interaction_count, total_users, NOW()),
    (target_user_id, 'success_rate', user_success_rate, total_users, NOW())
  ON CONFLICT DO NOTHING;
END;
$$;