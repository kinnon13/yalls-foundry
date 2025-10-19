-- Enable realtime for user_pins table
ALTER TABLE public.user_pins REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_pins;