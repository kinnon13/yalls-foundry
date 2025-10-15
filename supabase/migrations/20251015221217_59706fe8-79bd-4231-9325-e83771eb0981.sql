-- Enable realtime for admin/analytics tables (fixed)

-- Admin audit log
ALTER TABLE public.admin_audit_log REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_log;

-- AI interaction log (analytics)
ALTER TABLE public.ai_interaction_log REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_interaction_log;

-- CRM events (tracking)
ALTER TABLE public.crm_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_events;

-- Outbox (event queue)
ALTER TABLE public.outbox REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.outbox;

-- AI feedback
ALTER TABLE public.ai_feedback REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_feedback;

-- Content flags
ALTER TABLE public.content_flags REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_flags;