-- Voice interaction logs
CREATE TABLE IF NOT EXISTS public.voice_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL, -- 'call', 'voice_message', 'voice_chat'
  direction text NOT NULL, -- 'inbound', 'outbound'
  twilio_call_sid text,
  duration_seconds int,
  recording_url text,
  transcript text,
  status text NOT NULL DEFAULT 'initiated', -- 'initiated', 'in_progress', 'completed', 'failed'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.voice_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own voice interactions"
  ON public.voice_interactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Voice preferences
CREATE TABLE IF NOT EXISTS public.voice_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_voice_calls boolean DEFAULT false,
  allow_voice_messages boolean DEFAULT true,
  preferred_voice text DEFAULT 'alloy', -- OpenAI voice: alloy, echo, fable, onyx, nova, shimmer
  phone_number text,
  quiet_hours_start time,
  quiet_hours_end time,
  max_call_duration_minutes int DEFAULT 15,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own voice preferences"
  ON public.voice_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to check if voice calls are allowed
CREATE OR REPLACE FUNCTION public.can_initiate_voice_call(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs record;
  v_current_time time;
BEGIN
  -- Get preferences
  SELECT * INTO v_prefs
  FROM public.voice_preferences
  WHERE user_id = p_user_id;
  
  IF NOT FOUND OR NOT v_prefs.allow_voice_calls THEN
    RETURN false;
  END IF;
  
  -- Check quiet hours
  IF v_prefs.quiet_hours_start IS NOT NULL AND v_prefs.quiet_hours_end IS NOT NULL THEN
    v_current_time := CURRENT_TIME;
    
    IF v_prefs.quiet_hours_start < v_prefs.quiet_hours_end THEN
      -- Same day range (e.g., 22:00-07:00 next day)
      IF v_current_time >= v_prefs.quiet_hours_start AND v_current_time < v_prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    ELSE
      -- Crosses midnight (e.g., 22:00-07:00)
      IF v_current_time >= v_prefs.quiet_hours_start OR v_current_time < v_prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Trigger for voice_preferences updated_at
CREATE TRIGGER set_updated_at_voice_prefs
  BEFORE UPDATE ON public.voice_preferences
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for voice messages bucket
CREATE POLICY "Users can access their voice messages"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-messages' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their voice messages"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voice-messages' AND auth.uid()::text = (storage.foldername(name))[1]);