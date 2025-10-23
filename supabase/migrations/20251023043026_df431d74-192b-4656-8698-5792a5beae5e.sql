-- PART 4: Fix SECURITY DEFINER functions WITHOUT search_path (22 functions)
-- Critical for preventing SQL injection attacks

ALTER FUNCTION public.auto_favorite_rocker SET search_path = public;
ALTER FUNCTION public.check_tool_rate_limit SET search_path = public;
ALTER FUNCTION public.claim_embedding_jobs SET search_path = public;
ALTER FUNCTION public.cleanup_expired_handle_reservations SET search_path = public;
ALTER FUNCTION public.enqueue_missing_embeddings SET search_path = public;
ALTER FUNCTION public.evaluate_api_breakers SET search_path = public;
ALTER FUNCTION public.evaluate_topic_breakers SET search_path = public;
ALTER FUNCTION public.get_ai_preferences SET search_path = public;
ALTER FUNCTION public.link_chunks_to_files SET search_path = public;
ALTER FUNCTION public.record_api_outcome SET search_path = public;
ALTER FUNCTION public.record_topic_outcome SET search_path = public;
ALTER FUNCTION public.release_business_handle SET search_path = public;
ALTER FUNCTION public.reserve_business_handle SET search_path = public;
ALTER FUNCTION public.rocker_dm SET search_path = public;
ALTER FUNCTION public.set_feature_flag SET search_path = public;
ALTER FUNCTION public.sp_reveal_prediction SET search_path = public;
ALTER FUNCTION public.sp_score_round SET search_path = public;
ALTER FUNCTION public.tg_enqueue_embedding_job SET search_path = public;
ALTER FUNCTION public.unlock_expired_pins SET search_path = public;
ALTER FUNCTION public.update_prediction_accuracy SET search_path = public;
ALTER FUNCTION public.validate_business_handle SET search_path = public;