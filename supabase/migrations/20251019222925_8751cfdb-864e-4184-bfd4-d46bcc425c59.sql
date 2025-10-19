-- Learning Events Table (Bandit Logging)
CREATE TABLE IF NOT EXISTS public.learning_events (
  id           bigserial PRIMARY KEY,
  user_id      uuid        NOT NULL,
  surface      text        NOT NULL,
  candidate_id text        NOT NULL,
  policy       text        NOT NULL,
  p_exp        float       NOT NULL,
  score        float,
  explored     boolean     NOT NULL DEFAULT false,
  reward       float,
  context      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  ts           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_user_ts ON public.learning_events(user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_learning_surface_ts ON public.learning_events(surface, ts DESC);
CREATE INDEX IF NOT EXISTS idx_learning_policy_ts ON public.learning_events(policy, ts DESC);

ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learning_events_read_own" ON public.learning_events;
CREATE POLICY "learning_events_read_own"
  ON public.learning_events FOR SELECT
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.learning_events FROM anon, authenticated;

-- Rate Limits Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket     text PRIMARY KEY,
  count      int  NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.bump_rate(p_bucket text, p_limit int, p_window_seconds int)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_ok boolean;
BEGIN
  INSERT INTO public.rate_limits(bucket, count, expires_at)
  VALUES (p_bucket, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (bucket) DO UPDATE 
  SET count = rate_limits.count + 1
  RETURNING (count <= p_limit) INTO v_ok;

  DELETE FROM public.rate_limits WHERE expires_at < now();
  RETURN v_ok;
END;
$$;

-- Events Queue Table
CREATE TABLE IF NOT EXISTS public.events_queue (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic          text NOT NULL,
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb,
  status         text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','done','error')),
  attempts       int  NOT NULL DEFAULT 0,
  last_error     text,
  lease_token    uuid,
  lease_expires_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.events_queue FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_events_queue_topic_status ON public.events_queue(topic, status, created_at);

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
WHERE ts > now() - INTERVAL '24 hours'
GROUP BY policy;

ALTER VIEW public.vw_policy_health SET (security_invoker = on);

-- SLO Burn Rate View
CREATE OR REPLACE VIEW public.vw_slo_burnrate AS
SELECT 
  'feed' AS surface,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.intent_signals WHERE name = 'feed_load' AND ts > now() - INTERVAL '24 hours') = 0 
    THEN NULL
    ELSE (
      SELECT COALESCE(percentile_disc(0.95) WITHIN GROUP (ORDER BY (metadata->>'lat_ms')::int), 0)
      FROM public.intent_signals
      WHERE name = 'feed_load' AND ts > now() - INTERVAL '5 minutes'
    ) / NULLIF((
      SELECT percentile_disc(0.95) WITHIN GROUP (ORDER BY (metadata->>'lat_ms')::int)
      FROM public.intent_signals
      WHERE name = 'feed_load' AND ts > now() - INTERVAL '24 hours'
    ), 0)
  END AS burn_rate,
  now() AS calculated_at;

ALTER VIEW public.vw_slo_burnrate SET (security_invoker = on);

-- GC functions
CREATE OR REPLACE FUNCTION public.gc_learning_events()
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  DELETE FROM public.learning_events WHERE ts < now() - INTERVAL '90 days';
$$;

CREATE OR REPLACE FUNCTION public.gc_intent_signals()
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  DELETE FROM public.intent_signals WHERE ts < now() - INTERVAL '90 days';
$$;