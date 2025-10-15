-- Enable realtime for result_flags table

ALTER TABLE public.result_flags REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.result_flags;