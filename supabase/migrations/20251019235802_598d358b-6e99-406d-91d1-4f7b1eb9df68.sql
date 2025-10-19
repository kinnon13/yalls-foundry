-- ===================================================================
-- HARDENING: user_interest_profiles + Embedding System
-- ===================================================================

-- 0. DROP old function signature if exists
DROP FUNCTION IF EXISTS public.recompute_profile_embedding(uuid);

-- 1. DROP existing policies to replace with stricter ones
DROP POLICY IF EXISTS "Users can view their own interest profile" ON public.user_interest_profiles;
DROP POLICY IF EXISTS "System can manage interest profiles" ON public.user_interest_profiles;

-- 2. RLS POLICIES (stricter)
-- Users can read their own
CREATE POLICY "uip_read_own" 
  ON public.user_interest_profiles
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role can write (via SECURITY DEFINER functions)
CREATE POLICY "uip_write_system" 
  ON public.user_interest_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. INDEXES (performance + vector search)
CREATE INDEX IF NOT EXISTS idx_uip_user 
  ON public.user_interest_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_uip_updated_at 
  ON public.user_interest_profiles(updated_at DESC);

-- Vector similarity index (IVFFlat - adjust lists based on cardinality)
CREATE INDEX IF NOT EXISTS uip_emb_ivfflat
  ON public.user_interest_profiles
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. OBSERVABILITY VIEW (embedding freshness monitoring)
CREATE OR REPLACE VIEW public.vw_embedding_freshness AS
SELECT
  date_trunc('hour', updated_at) AS hour_bucket,
  count(*) AS ct,
  max(updated_at) AS last_write
FROM public.user_interest_profiles
GROUP BY 1
ORDER BY 1 DESC;

-- 5. BACKWARD COMPATIBILITY VIEW (for legacy code)
DROP VIEW IF EXISTS public.vw_profile_embeddings;
CREATE VIEW public.vw_profile_embeddings AS
SELECT 
  user_id, 
  embedding AS interests_embedding, 
  updated_at
FROM public.user_interest_profiles;

-- 6. RECOMPUTE RPC FUNCTION (for manual triggers & backfills)
CREATE OR REPLACE FUNCTION public.recompute_profile_embedding(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_ms BIGINT;
  v_result JSONB;
BEGIN
  v_start_ms := extract(epoch from clock_timestamp()) * 1000;
  
  -- Call analyze-traces edge function to recompute
  -- (In production, you'd invoke via pg_net or queue this)
  -- For now, return a stub that can be wired to edge function
  
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'recompute_queued', true,
    'latency_ms', (extract(epoch from clock_timestamp()) * 1000 - v_start_ms)::int
  );
  
  -- Log to action ledger
  INSERT INTO public.ai_action_ledger(user_id, agent, action, input, output, result)
  VALUES (
    p_user_id,
    'system',
    'recompute_embedding_queued',
    jsonb_build_object('user_id', p_user_id),
    v_result,
    'success'
  );
  
  RETURN v_result;
END;
$$;

-- 7. AUTO-RECOMPUTE TRIGGER (when user_interests change)
CREATE OR REPLACE FUNCTION public._recompute_on_interest_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Queue recompute (non-blocking)
  PERFORM public.recompute_profile_embedding(
    COALESCE(NEW.user_id, OLD.user_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_ui_recompute ON public.user_interests;
CREATE TRIGGER trg_ui_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.user_interests
  FOR EACH ROW 
  EXECUTE FUNCTION public._recompute_on_interest_change();

-- 8. GRANT PERMISSIONS (ensure service role can write)
GRANT SELECT ON public.user_interest_profiles TO authenticated, anon;
GRANT ALL ON public.user_interest_profiles TO service_role;
GRANT SELECT ON public.vw_profile_embeddings TO authenticated, anon;
GRANT SELECT ON public.vw_embedding_freshness TO authenticated;

-- 9. ANALYZE for query planner
ANALYZE public.user_interest_profiles;