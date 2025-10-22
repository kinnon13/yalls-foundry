-- Worker Runtime Schema
-- Durable queues, DLQ, cron, pools, quotas

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- AI Jobs Queue (durable)
-- =========================
CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  region text DEFAULT 'us',
  topic text NOT NULL,
  priority int DEFAULT 5,
  not_before timestamptz,
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 8,
  status text DEFAULT 'queued' CHECK (status IN ('queued','running','done','error')),
  fingerprint text UNIQUE,
  parent_job_id uuid,
  correlation_id text,
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_jobs_queue_idx ON public.ai_jobs(status, priority DESC, not_before, created_at DESC)
  WHERE status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS ai_jobs_tenant_topic_idx ON public.ai_jobs(tenant_id, topic);
CREATE INDEX IF NOT EXISTS ai_jobs_fingerprint_idx ON public.ai_jobs(fingerprint);
CREATE INDEX IF NOT EXISTS ai_jobs_correlation_idx ON public.ai_jobs(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_jobs_parent_idx ON public.ai_jobs(parent_job_id) WHERE parent_job_id IS NOT NULL;

-- =========================
-- Job Attempts Log
-- =========================
CREATE TABLE IF NOT EXISTS public.ai_job_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.ai_jobs(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  region text DEFAULT 'us',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  ok boolean,
  error text,
  duration_ms int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_job_attempts_job_idx ON public.ai_job_attempts(job_id, started_at DESC);

-- =========================
-- Dead Letter Queue
-- =========================
CREATE TABLE IF NOT EXISTS public.ai_job_dlq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_job_id uuid,
  tenant_id uuid NOT NULL,
  region text DEFAULT 'us',
  reason text NOT NULL,
  payload jsonb,
  quarantined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_job_dlq_tenant_idx ON public.ai_job_dlq(tenant_id, quarantined_at DESC);
CREATE INDEX IF NOT EXISTS ai_job_dlq_from_job_idx ON public.ai_job_dlq(from_job_id) WHERE from_job_id IS NOT NULL;

-- =========================
-- Cron Jobs
-- =========================
CREATE TABLE IF NOT EXISTS public.ai_cron_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  tenant_id uuid NOT NULL,
  region text DEFAULT 'us',
  cron text NOT NULL,
  jitter_sec int DEFAULT 30,
  enabled boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_cron_jobs_next_run_idx ON public.ai_cron_jobs(next_run_at)
  WHERE enabled = true AND next_run_at IS NOT NULL;

-- =========================
-- Worker Heartbeats
-- =========================
CREATE TABLE IF NOT EXISTS public.ai_worker_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id text NOT NULL,
  pool text NOT NULL,
  tenant_id uuid,
  region text DEFAULT 'us',
  last_beat timestamptz NOT NULL DEFAULT now(),
  load_pct int DEFAULT 0,
  version text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(worker_id, pool)
);

CREATE INDEX IF NOT EXISTS ai_worker_heartbeats_beat_idx ON public.ai_worker_heartbeats(last_beat DESC);
CREATE INDEX IF NOT EXISTS ai_worker_heartbeats_pool_idx ON public.ai_worker_heartbeats(pool, last_beat DESC);

-- =========================
-- Worker Pools Config
-- =========================
CREATE TABLE IF NOT EXISTS public.ai_worker_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool text UNIQUE NOT NULL,
  tenant_id uuid,
  region text DEFAULT 'us',
  min_concurrency int NOT NULL DEFAULT 1,
  max_concurrency int NOT NULL DEFAULT 10,
  burst_concurrency int NOT NULL DEFAULT 15,
  topic_glob text NOT NULL,
  current_concurrency int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_worker_pools_pool_idx ON public.ai_worker_pools(pool);

-- =========================
-- Quota Counters (per-tenant)
-- =========================
CREATE TABLE IF NOT EXISTS public.ai_quota_counters (
  tenant_id uuid NOT NULL,
  region text DEFAULT 'us',
  window_start timestamptz NOT NULL,
  api_calls int DEFAULT 0,
  tokens int DEFAULT 0,
  jobs_enqueued int DEFAULT 0,
  cost_cents int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, window_start)
);

CREATE INDEX IF NOT EXISTS ai_quota_counters_window_idx ON public.ai_quota_counters(window_start DESC);

-- =========================
-- RLS Policies (tenant isolation)
-- =========================
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_job_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_job_dlq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_worker_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_worker_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_quota_counters ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically
-- Workers can read/write within their tenant scope
CREATE POLICY ai_jobs_tenant_isolation ON public.ai_jobs
  FOR ALL USING (
    tenant_id::text = coalesce(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')
  );

CREATE POLICY ai_job_attempts_tenant_isolation ON public.ai_job_attempts
  FOR ALL USING (
    tenant_id::text = coalesce(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')
  );

CREATE POLICY ai_job_dlq_tenant_isolation ON public.ai_job_dlq
  FOR ALL USING (
    tenant_id::text = coalesce(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')
  );

CREATE POLICY ai_cron_jobs_tenant_isolation ON public.ai_cron_jobs
  FOR ALL USING (
    tenant_id::text = coalesce(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')
  );

-- Heartbeats and pools are readable by all (for monitoring)
CREATE POLICY ai_worker_heartbeats_read ON public.ai_worker_heartbeats
  FOR SELECT USING (true);

CREATE POLICY ai_worker_heartbeats_write ON public.ai_worker_heartbeats
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.super_admins)
  );

CREATE POLICY ai_worker_pools_read ON public.ai_worker_pools
  FOR SELECT USING (true);

CREATE POLICY ai_worker_pools_write ON public.ai_worker_pools
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.super_admins)
  );

CREATE POLICY ai_quota_counters_tenant_isolation ON public.ai_quota_counters
  FOR ALL USING (
    tenant_id::text = coalesce(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')
  );

-- =========================
-- Helper Functions
-- =========================

-- Function to increment job attempts
CREATE OR REPLACE FUNCTION increment_job_attempt(p_job_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.ai_jobs
  SET attempts = attempts + 1, updated_at = now()
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to requeue failed job with exponential backoff
CREATE OR REPLACE FUNCTION requeue_failed_job(p_job_id uuid, p_error text)
RETURNS void AS $$
DECLARE
  v_attempts int;
  v_max_attempts int;
  v_backoff_sec int;
BEGIN
  SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
  FROM public.ai_jobs WHERE id = p_job_id;
  
  IF v_attempts >= v_max_attempts THEN
    -- Move to DLQ
    INSERT INTO public.ai_job_dlq (from_job_id, tenant_id, region, reason, payload)
    SELECT id, tenant_id, region, p_error, payload
    FROM public.ai_jobs WHERE id = p_job_id;
    
    UPDATE public.ai_jobs SET status = 'error', updated_at = now()
    WHERE id = p_job_id;
  ELSE
    -- Requeue with exponential backoff: 2^attempts seconds
    v_backoff_sec := POWER(2, v_attempts);
    
    UPDATE public.ai_jobs
    SET status = 'queued',
        not_before = now() + (v_backoff_sec || ' seconds')::interval,
        updated_at = now()
    WHERE id = p_job_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;