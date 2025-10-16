-- Indexes to speed up dashboard queries
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created ON public.ai_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_target ON public.ai_feedback(user_id, target);
