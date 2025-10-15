-- Enable realtime for AI learning tables
ALTER TABLE public.ai_user_memory REPLICA IDENTITY FULL;
ALTER TABLE public.rocker_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.ai_user_analytics REPLICA IDENTITY FULL;
ALTER TABLE public.ai_global_patterns REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_user_memory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rocker_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_user_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_global_patterns;