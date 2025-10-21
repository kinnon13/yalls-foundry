-- Add AI preferences for Super Andy real-time mode
CREATE TABLE IF NOT EXISTS ai_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  super_mode BOOLEAN DEFAULT true,
  voice_enabled BOOLEAN DEFAULT true,
  live_question_cadence TEXT DEFAULT 'high' CHECK (live_question_cadence IN ('high', 'normal', 'low')),
  silence_ms INT DEFAULT 2500,
  confirm_threshold NUMERIC DEFAULT 0.55,
  max_questions_per_thread INT DEFAULT 5,
  snoozed_until TIMESTAMPTZ,
  dnd_start TIME,
  dnd_end TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Per-thread snooze preferences
CREATE TABLE IF NOT EXISTS ai_thread_prefs (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL,
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, thread_id)
);

-- Track AI questions to prevent duplicates
CREATE TABLE IF NOT EXISTS ai_question_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID,
  question_text TEXT NOT NULL,
  question_hash TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_question_hash ON ai_question_events(user_id, question_hash);
CREATE INDEX IF NOT EXISTS idx_ai_thread_prefs ON ai_thread_prefs(user_id, thread_id);

-- Enable RLS
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_thread_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_question_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own AI preferences"
  ON ai_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own AI preferences"
  ON ai_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own thread preferences"
  ON ai_thread_prefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own thread preferences"
  ON ai_thread_prefs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own question events"
  ON ai_question_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage question events"
  ON ai_question_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to get or create default AI preferences
CREATE OR REPLACE FUNCTION get_ai_preferences(p_user_id UUID)
RETURNS ai_preferences AS $$
DECLARE
  prefs ai_preferences;
BEGIN
  SELECT * INTO prefs FROM ai_preferences WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO ai_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO prefs;
  END IF;
  
  RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;