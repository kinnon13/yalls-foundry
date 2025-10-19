-- Auth Rate Limiter Functions
-- Uses existing kv_counters for tracking auth attempts

-- Function to check and increment auth attempts
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  p_identifier TEXT,  -- email or IP
  p_window_sec INT DEFAULT 600  -- 10 minutes
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count BIGINT;
  v_limit INT := 10;  -- 10 attempts per window
  v_captcha_threshold INT := 6;  -- Show CAPTCHA after 6 attempts
BEGIN
  -- Try advisory lock
  IF NOT pg_try_advisory_lock(hashtext(p_identifier)) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'needs_captcha', true,
      'reason', 'lock_failed'
    );
  END IF;
  
  BEGIN
    -- Clean expired entries
    DELETE FROM public.kv_counters
    WHERE expires_at < now();
    
    -- Get or increment counter
    SELECT v INTO v_count
    FROM public.kv_counters
    WHERE k = 'auth:' || p_identifier;
    
    IF v_count IS NULL THEN
      -- First attempt
      INSERT INTO public.kv_counters(k, v, expires_at)
      VALUES (
        'auth:' || p_identifier,
        1,
        now() + make_interval(secs => p_window_sec)
      );
      v_count := 1;
    ELSIF v_count >= v_limit THEN
      -- Over limit
      PERFORM pg_advisory_unlock(hashtext(p_identifier));
      RETURN jsonb_build_object(
        'allowed', false,
        'remaining', 0,
        'needs_captcha', true,
        'retry_after', EXTRACT(EPOCH FROM (
          (SELECT expires_at FROM public.kv_counters WHERE k = 'auth:' || p_identifier) - now()
        ))::INT
      );
    ELSE
      -- Increment
      UPDATE public.kv_counters
      SET v = v + 1
      WHERE k = 'auth:' || p_identifier;
      v_count := v_count + 1;
    END IF;
    
    PERFORM pg_advisory_unlock(hashtext(p_identifier));
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', v_limit - v_count,
      'needs_captcha', v_count >= v_captcha_threshold,
      'attempts', v_count
    );
    
  EXCEPTION WHEN OTHERS THEN
    PERFORM pg_advisory_unlock(hashtext(p_identifier));
    RAISE;
  END;
END;
$$;

-- Function to reset auth attempts (for successful login or manual reset)
CREATE OR REPLACE FUNCTION public.reset_auth_rate_limit(p_identifier TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.kv_counters
  WHERE k = 'auth:' || p_identifier;
END;
$$;