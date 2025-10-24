-- Voice Profiles for Speaker Recognition
-- Stores voice characteristics to recognize who's speaking

CREATE TABLE IF NOT EXISTS public.voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  speaker_name TEXT NOT NULL,
  voice_sample_url TEXT,
  voice_features JSONB,
  confidence_threshold FLOAT DEFAULT 0.75,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, speaker_name)
);

CREATE INDEX idx_voice_profiles_user ON public.voice_profiles(user_id);

-- Voice Recognition Events
CREATE TABLE IF NOT EXISTS public.voice_recognition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_profile_id UUID REFERENCES public.voice_profiles(id) ON DELETE SET NULL,
  audio_sample_url TEXT,
  recognized_speaker TEXT,
  confidence FLOAT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_voice_recognition_user ON public.voice_recognition_events(user_id);
CREATE INDEX idx_voice_recognition_profile ON public.voice_recognition_events(voice_profile_id);

-- Enable RLS
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_recognition_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own voice profiles"
  ON public.voice_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own recognition events"
  ON public.voice_recognition_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert recognition events"
  ON public.voice_recognition_events
  FOR INSERT
  WITH CHECK (true);

-- Updated trigger
CREATE OR REPLACE FUNCTION update_voice_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voice_profile_updated_at
  BEFORE UPDATE ON public.voice_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_profile_timestamp();

-- Storage bucket for voice samples
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-samples', 'voice-samples', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own voice samples"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-samples' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own voice samples"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'voice-samples' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own voice samples"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'voice-samples' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );