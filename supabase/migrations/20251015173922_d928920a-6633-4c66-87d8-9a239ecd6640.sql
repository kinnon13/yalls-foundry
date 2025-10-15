-- Create conversation sessions table for metadata (titles, summaries)
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL UNIQUE,
  title TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users view own conversation sessions"
ON conversation_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users insert own conversation sessions"
ON conversation_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users update own conversation sessions"
ON conversation_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users delete own conversation sessions"
ON conversation_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX idx_conversation_sessions_session_id ON conversation_sessions(session_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_conversation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_sessions_updated_at
BEFORE UPDATE ON conversation_sessions
FOR EACH ROW
EXECUTE FUNCTION update_conversation_sessions_updated_at();