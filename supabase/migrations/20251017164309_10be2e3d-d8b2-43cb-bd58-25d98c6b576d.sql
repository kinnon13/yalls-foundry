-- PR-S1 PART 1: Fix post_targets schema + add rate limiting infrastructure

-- 1) Add canonical target_entity_id column to post_targets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'post_targets'
      AND column_name = 'target_entity_id'
  ) THEN
    ALTER TABLE public.post_targets ADD COLUMN target_entity_id UUID;
    
    -- Backfill from entity_id if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='post_targets' AND column_name='entity_id'
    ) THEN
      UPDATE public.post_targets SET target_entity_id = entity_id WHERE target_entity_id IS NULL;
    END IF;
    
    -- Make NOT NULL if all rows filled
    IF NOT EXISTS (SELECT 1 FROM public.post_targets WHERE target_entity_id IS NULL LIMIT 1) THEN
      ALTER TABLE public.post_targets ALTER COLUMN target_entity_id SET NOT NULL;
    END IF;
    
    -- Index for feed queries
    CREATE INDEX IF NOT EXISTS idx_post_targets_target_entity
      ON public.post_targets(target_entity_id);
  END IF;
END $$;

-- 2) Rate limiting infrastructure
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  id BIGSERIAL PRIMARY KEY,
  scope TEXT NOT NULL,
  count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scope, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_scope_window 
  ON public.rate_limit_counters(scope, window_start DESC);

-- Enable RLS on rate_limit_counters
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- System can manage rate limits
CREATE POLICY rate_limit_system_all ON public.rate_limit_counters
  FOR ALL USING (true) WITH CHECK (true);

-- 3) Rate limit check function (uses advisory locks)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_scope TEXT,
  p_limit INT,
  p_window_sec INT DEFAULT 60
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ := date_trunc('minute', now());
  v_count INT;
  v_allowed BOOLEAN;
BEGIN
  -- Try advisory lock (non-blocking)
  IF NOT pg_try_advisory_lock(hashtext(p_scope)) THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'reason', 'lock_failed');
  END IF;
  
  BEGIN
    -- Clean old windows
    DELETE FROM public.rate_limit_counters
    WHERE window_start < now() - make_interval(secs => p_window_sec * 2);
    
    -- Get current count
    SELECT count INTO v_count
    FROM public.rate_limit_counters
    WHERE scope = p_scope AND window_start = v_window_start;
    
    IF v_count IS NULL THEN
      -- First request in window
      INSERT INTO public.rate_limit_counters(scope, window_start, count)
      VALUES (p_scope, v_window_start, 1);
      v_count := 1;
    ELSIF v_count >= p_limit THEN
      -- Over limit
      v_allowed := false;
    ELSE
      -- Increment
      UPDATE public.rate_limit_counters
      SET count = count + 1
      WHERE scope = p_scope AND window_start = v_window_start;
      v_count := v_count + 1;
    END IF;
    
    v_allowed := v_count <= p_limit;
    
    PERFORM pg_advisory_unlock(hashtext(p_scope));
    
    RETURN jsonb_build_object(
      'allowed', v_allowed,
      'remaining', GREATEST(0, p_limit - v_count),
      'limit', p_limit,
      'window_sec', p_window_sec
    );
  EXCEPTION WHEN OTHERS THEN
    PERFORM pg_advisory_unlock(hashtext(p_scope));
    RAISE;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT) TO authenticated, anon;