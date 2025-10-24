-- Add missing index for yallbrary pins user lookup performance
CREATE INDEX IF NOT EXISTS idx_yallbrary_pins_user_app ON public.yallbrary_pins(user_id, app_id);