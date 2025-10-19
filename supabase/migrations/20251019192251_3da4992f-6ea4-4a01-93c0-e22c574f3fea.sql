-- Create rocker_conversations table for AI chat persistence
CREATE TABLE IF NOT EXISTS public.rocker_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, session_id)
);

-- Enable RLS
ALTER TABLE public.rocker_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users can view their rocker conversations"
  ON public.rocker_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users can create rocker conversations"
  ON public.rocker_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update rocker conversations"
  ON public.rocker_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_rocker_conversations_user_session ON public.rocker_conversations(user_id, session_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_rocker_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rocker_conversations_timestamp
  BEFORE UPDATE ON public.rocker_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_rocker_conversations_updated_at();