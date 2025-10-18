-- Ensure Rocker consent and logging RPCs exist

-- Check if user_consents table exists, create if needed
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'user_consents'
  ) THEN
    CREATE TABLE public.user_consents (
      user_id UUID PRIMARY KEY,
      telemetry_basic BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY user_consents_self 
    ON public.user_consents 
    FOR SELECT 
    USING (user_id = auth.uid());
  END IF;
END $$;

-- rocker_check_consent function
CREATE OR REPLACE FUNCTION public.rocker_check_consent(
  p_user_id UUID,
  p_action_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_allowed BOOLEAN := TRUE;
  v_consent RECORD;
BEGIN
  -- Check ai_consent table first (main consent table)
  SELECT proactive_enabled INTO v_consent
  FROM public.ai_consent
  WHERE user_id = p_user_id;
  
  -- If telemetry_basic, check user_consents as fallback
  IF p_action_type = 'telemetry_basic' THEN
    IF v_consent IS NULL THEN
      SELECT telemetry_basic INTO v_allowed
      FROM public.user_consents 
      WHERE user_id = p_user_id;
    ELSE
      v_allowed := v_consent.proactive_enabled;
    END IF;
  END IF;
  
  RETURN jsonb_build_object('allowed', COALESCE(v_allowed, TRUE));
END;
$$;

-- rocker_log_action function (enhanced signature)
CREATE OR REPLACE FUNCTION public.rocker_log_action(
  p_user_id UUID,
  p_agent TEXT,
  p_action TEXT,
  p_input JSONB DEFAULT '{}'::JSONB,
  p_output JSONB DEFAULT '{}'::JSONB,
  p_result TEXT DEFAULT 'success',
  p_entity_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_action_ledger (
    user_id,
    agent,
    action,
    input,
    output,
    result,
    correlation_id
  )
  VALUES (
    p_user_id,
    p_agent,
    p_action,
    COALESCE(p_input, '{}'::JSONB),
    COALESCE(p_output, '{}'::JSONB),
    COALESCE(p_result, 'success'),
    gen_random_uuid()
  );
END;
$$;