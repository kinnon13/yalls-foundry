-- Create conversation history table
CREATE TABLE IF NOT EXISTS public.rocker_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rocker_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users can view their own conversations"
  ON public.rocker_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert conversations
CREATE POLICY "System can insert conversations"
  ON public.rocker_conversations
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON public.rocker_conversations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Add index for performance
CREATE INDEX idx_rocker_conversations_user_created 
  ON public.rocker_conversations(user_id, created_at DESC);

CREATE INDEX idx_rocker_conversations_session 
  ON public.rocker_conversations(session_id, created_at DESC);