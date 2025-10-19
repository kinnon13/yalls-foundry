-- Add auto-pin tracking columns to user_pins
ALTER TABLE public.user_pins 
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual', 'auto_follow')),
  ADD COLUMN IF NOT EXISTS locked_until timestamptz NULL,
  ADD COLUMN IF NOT EXISTS lock_reason text NULL,
  ADD COLUMN IF NOT EXISTS use_count integer NOT NULL DEFAULT 0;

-- Create index for locked pins queries
CREATE INDEX IF NOT EXISTS idx_user_pins_locked ON public.user_pins(user_id, locked_until) WHERE locked_until IS NOT NULL;

-- Function to check if pin is locked
CREATE OR REPLACE FUNCTION public.is_pin_locked(p_pin_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT locked_until IS NOT NULL AND locked_until > now()
  FROM public.user_pins
  WHERE id = p_pin_id;
$$;

-- Function to unlock pins that have passed their lock period
CREATE OR REPLACE FUNCTION public.unlock_expired_pins()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.user_pins
  SET locked_until = NULL, lock_reason = NULL
  WHERE locked_until IS NOT NULL AND locked_until <= now()
  RETURNING 1;
$$;

-- Function to increment use count and potentially unlock
CREATE OR REPLACE FUNCTION public.increment_pin_use(p_pin_id uuid, p_unlock_threshold integer DEFAULT 3)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_use_count integer;
  v_unlocked boolean := false;
BEGIN
  UPDATE public.user_pins
  SET use_count = use_count + 1
  WHERE id = p_pin_id AND user_id = auth.uid()
  RETURNING use_count INTO v_use_count;

  -- Unlock if threshold reached
  IF v_use_count >= p_unlock_threshold THEN
    UPDATE public.user_pins
    SET locked_until = NULL, lock_reason = NULL
    WHERE id = p_pin_id AND user_id = auth.uid() AND locked_until IS NOT NULL;
    
    v_unlocked := FOUND;
  END IF;

  RETURN jsonb_build_object(
    'use_count', v_use_count,
    'unlocked', v_unlocked
  );
END;
$$;