-- P3: Worker Job Locking Function
-- Atomically locks and returns next available job for processing

CREATE OR REPLACE FUNCTION lock_next_job(
  p_pool text,
  p_topics text[]
)
RETURNS TABLE (
  id uuid,
  topic text,
  priority int,
  payload jsonb,
  tenant_id uuid,
  region text,
  attempts int,
  max_attempts int
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  -- Lock and update job in one atomic operation
  UPDATE ai_jobs
  SET 
    status = 'running',
    attempts = attempts + 1,
    updated_at = now()
  WHERE ai_jobs.id = (
    SELECT ai_jobs.id
    FROM ai_jobs
    WHERE 
      ai_jobs.status = 'queued'
      AND ai_jobs.topic = ANY(p_topics)
      AND (ai_jobs.not_before IS NULL OR ai_jobs.not_before <= now())
    ORDER BY ai_jobs.priority ASC, ai_jobs.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING ai_jobs.id INTO v_job_id;

  -- Return the locked job
  IF v_job_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      j.id,
      j.topic,
      j.priority,
      j.payload,
      j.tenant_id,
      j.region,
      j.attempts,
      j.max_attempts
    FROM ai_jobs j
    WHERE j.id = v_job_id;
  END IF;
END;
$$;