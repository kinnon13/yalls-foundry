
-- Create learning_events table for bandit algorithm
CREATE TABLE IF NOT EXISTS public.learning_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surface TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  policy TEXT NOT NULL,
  p_exp FLOAT NOT NULL CHECK (p_exp BETWEEN 0 AND 1),
  score FLOAT,
  explored BOOLEAN NOT NULL DEFAULT false,
  reward FLOAT CHECK (reward IS NULL OR (reward BETWEEN 0 AND 1)),
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_user_ts ON public.learning_events(user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_learning_surface_ts ON public.learning_events(surface, ts DESC);
CREATE INDEX IF NOT EXISTS idx_learning_policy_ts ON public.learning_events(policy, ts DESC);

ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own learning events" ON public.learning_events;
CREATE POLICY "Users can read own learning events"
ON public.learning_events FOR SELECT
USING (auth.uid() = user_id);

-- Rate limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct client access to rate_limits
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.bump_rate(
  p_bucket TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  INSERT INTO public.rate_limits(bucket, count, expires_at)
  VALUES (p_bucket, 1, NOW() + MAKE_INTERVAL(secs => p_window_seconds))
  ON CONFLICT (bucket) DO UPDATE 
  SET count = public.rate_limits.count + 1
  RETURNING (count <= p_limit) INTO v_ok;

  -- Cleanup expired entries
  DELETE FROM public.rate_limits WHERE expires_at < NOW();
  
  RETURN v_ok;
END;
$$;

-- Observability: Policy Health View
CREATE OR REPLACE VIEW public.vw_policy_health AS
SELECT
  COALESCE(policy, 'none') AS policy,
  COUNT(*) AS impression_count,
  AVG(p_exp) AS avg_epsilon,
  AVG(CASE WHEN explored THEN 1.0 ELSE 0.0 END) AS exploration_rate,
  AVG(reward) FILTER (WHERE reward IS NOT NULL) AS avg_reward,
  STDDEV(reward) FILTER (WHERE reward IS NOT NULL) AS reward_stddev,
  MAX(ts) AS last_impression
FROM public.learning_events
WHERE ts > NOW() - INTERVAL '24 hours'
GROUP BY policy;

ALTER VIEW public.vw_policy_health SET (security_invoker = on);

-- SLO Burn Rate View
CREATE OR REPLACE VIEW public.vw_slo_burnrate AS
SELECT 
  'feed' AS surface,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.intent_signals WHERE name = 'feed_load' AND ts > NOW() - INTERVAL '24 hours') = 0 
    THEN NULL
    ELSE (
      SELECT COALESCE(percentile_disc(0.95) WITHIN GROUP (ORDER BY (metadata->>'lat_ms')::int), 0)
      FROM public.intent_signals
      WHERE name = 'feed_load' AND ts > NOW() - INTERVAL '5 minutes'
    ) / NULLIF((
      SELECT percentile_disc(0.95) WITHIN GROUP (ORDER BY (metadata->>'lat_ms')::int)
      FROM public.intent_signals
      WHERE name = 'feed_load' AND ts > NOW() - INTERVAL '24 hours'
    ), 0)
  END AS burn_rate,
  NOW() AS calculated_at;

ALTER VIEW public.vw_slo_burnrate SET (security_invoker = on);

-- GC function
CREATE OR REPLACE FUNCTION public.gc_learning_events()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.learning_events WHERE ts < NOW() - INTERVAL '90 days';
$$;
