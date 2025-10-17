-- ========== PR4.1: RPC Observability (Fixed) ==========

-- 0) Helper: resolve tenant from JWT
CREATE OR REPLACE FUNCTION public.resolve_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'tenant_id', '')::uuid;
$$;

-- 1) Event table
CREATE TABLE IF NOT EXISTS public.rpc_observations (
  id               bigserial PRIMARY KEY,
  tenant_id        uuid,
  user_id          uuid,
  rpc_name         text NOT NULL,
  duration_ms      integer NOT NULL CHECK (duration_ms >= 0),
  status           text NOT NULL CHECK (status IN ('ok','error','noop')),
  error_code       text,
  meta             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 2) RLS
ALTER TABLE public.rpc_observations ENABLE ROW LEVEL SECURITY;

-- Insert: any authenticated user may insert rows about their call
CREATE POLICY rpc_obs_insert_self
  ON public.rpc_observations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3) Fast indexes
CREATE INDEX IF NOT EXISTS idx_rpc_obs_tenant_name_time
  ON public.rpc_observations(tenant_id, rpc_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rpc_obs_time
  ON public.rpc_observations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rpc_obs_status
  ON public.rpc_observations(status);

-- 4) Write RPC (centralized insert)
CREATE OR REPLACE FUNCTION public.rpc_observe(
  p_rpc_name    text,
  p_duration_ms int,
  p_status      text,
  p_error_code  text DEFAULT NULL,
  p_meta        jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rpc_observations(tenant_id, user_id, rpc_name, duration_ms, status, error_code, meta)
  VALUES (resolve_tenant_id(), auth.uid(), p_rpc_name, p_duration_ms, p_status, p_error_code, COALESCE(p_meta,'{}'::jsonb));
END;
$$;

-- 5) Aggregation RPC: p50/p95/p99, avg, calls, error_rate (with proper casting)
CREATE OR REPLACE FUNCTION public.rpc_metrics(p_window_minutes int DEFAULT 60)
RETURNS TABLE(
  rpc_name text,
  calls bigint,
  error_rate_pct numeric,
  avg_ms numeric,
  p50_ms numeric,
  p95_ms numeric,
  p99_ms numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH scoped AS (
    SELECT *
    FROM public.rpc_observations
    WHERE created_at >= now() - make_interval(mins => p_window_minutes)
      AND (tenant_id = resolve_tenant_id() OR resolve_tenant_id() IS NULL)
  )
  SELECT
    rpc_name,
    COUNT(*)::bigint AS calls,
    ROUND(100.0 * AVG( (status = 'error')::int )::numeric, 2) AS error_rate_pct,
    ROUND(AVG(duration_ms)::numeric, 2) AS avg_ms,
    ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms)::numeric, 2) AS p50_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 2) AS p95_ms,
    ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms)::numeric, 2) AS p99_ms
  FROM scoped
  GROUP BY rpc_name
  ORDER BY p95_ms DESC NULLS LAST, calls DESC;
$$;

-- 6) Slowest RPCs helper
CREATE OR REPLACE FUNCTION public.rpc_slowest(p_window_minutes int DEFAULT 60, p_limit int DEFAULT 5)
RETURNS TABLE(
  rpc_name text,
  calls bigint,
  error_rate_pct numeric,
  avg_ms numeric,
  p50_ms numeric,
  p95_ms numeric,
  p99_ms numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.rpc_metrics(p_window_minutes)
  ORDER BY p95_ms DESC NULLS LAST
  LIMIT p_limit;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.rpc_observe(text,int,text,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_metrics(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_slowest(int,int) TO authenticated;