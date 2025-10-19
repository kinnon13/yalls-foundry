-- BILLIONAIRE-GRADE INFRASTRUCTURE: Queue, Learning, Rate Limits, Hardening

-- ========= QUEUE IDEMPOTENCY (Discovery only for now) =========
CREATE UNIQUE INDEX IF NOT EXISTS uq_disc_queue_interest_cat_reason
  ON public.marketplace_discovery_queue(interest_id, category_id, reason);

-- ========= STATEMENT TIMEOUTS (5s for heavy RPCs) =========
ALTER FUNCTION public.marketplace_suggestions_for_user(uuid,int)
  SET statement_timeout = '5s';
ALTER FUNCTION public.enqueue_discovery_for_user(uuid)
  SET statement_timeout = '5s';
ALTER FUNCTION public.ensure_category_for_interest(uuid)
  SET statement_timeout = '5s';

-- ========= AUTOVACUUM TUNING FOR HOT TABLES =========
ALTER TABLE public.marketplace_discovery_queue SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.02
);

-- ========= PROFILE EMBEDDING BACKFILL UTIL =========
CREATE OR REPLACE FUNCTION public.recompute_profile_embedding(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_embeds vector(768)[];
  v_affinities float[];
  v_sum float[];
  v_weight_sum float := 0;
  i int;
  j int;
BEGIN
  -- Collect embeddings and affinities
  SELECT 
    array_agg(ic.embedding),
    array_agg(ui.affinity)
  INTO v_embeds, v_affinities
  FROM public.user_interests ui
  JOIN public.interest_catalog ic ON ic.id = ui.interest_id
  WHERE ui.user_id = p_user_id AND ic.embedding IS NOT NULL;

  IF v_embeds IS NULL OR array_length(v_embeds, 1) = 0 THEN
    UPDATE public.profiles SET interests_embedding = NULL WHERE user_id = p_user_id;
    RETURN;
  END IF;

  -- Initialize sum array
  v_sum := array_fill(0::float, ARRAY[768]);
  
  -- Weighted sum
  FOR i IN 1..array_length(v_embeds, 1) LOOP
    v_weight_sum := v_weight_sum + v_affinities[i];
    FOR j IN 1..768 LOOP
      v_sum[j] := v_sum[j] + (v_embeds[i])[j] * v_affinities[i];
    END LOOP;
  END LOOP;

  -- Normalize by total weight
  IF v_weight_sum > 0 THEN
    FOR j IN 1..768 LOOP
      v_sum[j] := v_sum[j] / v_weight_sum;
    END LOOP;
  END IF;

  UPDATE public.profiles
  SET interests_embedding = v_sum::vector(768)
  WHERE user_id = p_user_id;
END
$$;

-- ========= ANALYZE FOR PLANNER =========
ANALYZE public.interest_catalog;
ANALYZE public.profiles;
ANALYZE public.marketplace_listings;