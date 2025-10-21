-- P0 Fix Pack: Dual Search + Job Queue + Rate Limiting

-- 1) Lock feature flag writes to super_admin only
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_flags_select ON public.feature_flags;
CREATE POLICY feature_flags_select 
ON public.feature_flags
FOR SELECT TO authenticated 
USING (true);

DROP POLICY IF EXISTS feature_flags_update ON public.feature_flags;
CREATE POLICY feature_flags_update 
ON public.feature_flags
FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- 2) Dual search indices (private vs marketplace)

-- Private corpus (org-scoped)
CREATE TABLE IF NOT EXISTS public.private_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  doc_id TEXT,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_private_chunks_org 
  ON public.private_chunks(org_id);

CREATE INDEX IF NOT EXISTS idx_private_chunks_doc 
  ON public.private_chunks(doc_id);

-- Marketplace corpus (public)
CREATE TABLE IF NOT EXISTS public.market_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Private search function
CREATE OR REPLACE FUNCTION match_private_chunks(
  org_id_in UUID, 
  query_embedding vector, 
  match_count INT
)
RETURNS TABLE(
  id UUID, 
  doc_id TEXT, 
  content TEXT, 
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT 
    id, 
    doc_id, 
    content, 
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.private_chunks
  WHERE org_id = org_id_in
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Marketplace search function
CREATE OR REPLACE FUNCTION match_market_chunks(
  query_embedding vector, 
  match_count INT
)
RETURNS TABLE(
  id UUID, 
  content TEXT, 
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT 
    id, 
    content, 
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.market_chunks
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 3) Job queue for heavy operations

CREATE TABLE IF NOT EXISTS public.ingest_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  kind TEXT NOT NULL,  -- 'embed' | 'crawl' | 'ocr'
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',  -- queued|running|done|error
  attempts INT NOT NULL DEFAULT 0,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  external_idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingest_jobs_pick 
  ON public.ingest_jobs(status, run_at);

CREATE INDEX IF NOT EXISTS idx_ingest_jobs_org 
  ON public.ingest_jobs(org_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ingest_jobs_idempotency 
  ON public.ingest_jobs(external_idempotency_key) 
  WHERE external_idempotency_key IS NOT NULL;

-- Job claim function with per-org concurrency control
CREATE OR REPLACE FUNCTION claim_ingest_job()
RETURNS public.ingest_jobs
LANGUAGE plpgsql AS $$
DECLARE 
  j public.ingest_jobs;
  max_per_org INT := COALESCE(
    NULLIF(current_setting('app.ingest_max_per_org', true), '')::INT, 
    1
  );
BEGIN
  -- Find org with running < MAX_PER_ORG
  WITH org_counts AS (
    SELECT org_id, count(*) AS running
    FROM public.ingest_jobs
    WHERE status = 'running'
    GROUP BY org_id
  ), pool AS (
    SELECT q.*
    FROM public.ingest_jobs q
    LEFT JOIN org_counts c ON c.org_id = q.org_id
    WHERE q.status = 'queued' 
      AND q.run_at <= now()
      AND (c.running IS NULL OR c.running < max_per_org)
    ORDER BY q.run_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  SELECT * INTO j FROM pool;

  IF j.id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.ingest_jobs 
  SET 
    status = 'running', 
    attempts = attempts + 1, 
    updated_at = now()
  WHERE id = j.id;

  RETURN j;
END;
$$;

-- Set default per-org concurrency
SELECT set_config('app.ingest_max_per_org', '1', false);

-- 4) Rate limiting infrastructure

CREATE TABLE IF NOT EXISTS public.rate_counters (
  bucket TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_counters_updated 
  ON public.rate_counters(updated_at);

-- Rate limit bump function
CREATE OR REPLACE FUNCTION bump_rate(
  bucket TEXT, 
  limit_in INT
)
RETURNS BOOLEAN 
LANGUAGE plpgsql AS $$
DECLARE c INT;
BEGIN
  -- Insert or ignore
  INSERT INTO public.rate_counters(bucket, count, updated_at) 
  VALUES (bucket, 0, now())
  ON CONFLICT (bucket) DO NOTHING;

  -- Increment and get count
  UPDATE public.rate_counters 
  SET count = count + 1, updated_at = now() 
  WHERE bucket = bump_rate.bucket 
  RETURNING count INTO c;

  -- Check limit
  IF c > limit_in THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Cleanup old rate counter windows (run via cron)
CREATE OR REPLACE FUNCTION cleanup_rate_counters()
RETURNS VOID 
LANGUAGE sql AS $$
  DELETE FROM public.rate_counters 
  WHERE updated_at < now() - interval '2 hours';
$$;