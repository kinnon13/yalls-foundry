-- Create table for computed user interest profiles with embeddings
CREATE TABLE IF NOT EXISTS public.user_interest_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  interests JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536),
  last_computed_at TIMESTAMP WITH TIME ZONE,
  trace_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_interest_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own interest profile"
  ON public.user_interest_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage interest profiles"
  ON public.user_interest_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_interest_profiles_user_id 
  ON public.user_interest_profiles(user_id);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_interest_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();