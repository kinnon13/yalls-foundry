-- Combined memory system: where user + Andy memories merge
CREATE TABLE IF NOT EXISTS combined_memory_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  parent_file_id UUID REFERENCES combined_memory_files(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- full hierarchical path
  content JSONB NOT NULL, -- merged insights from user + Andy
  user_memory_ids UUID[], -- source user memories
  andy_research_ids UUID[], -- source Andy research
  merge_reasoning TEXT, -- why these were combined
  confidence NUMERIC DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Andy's prediction game: testing how well he knows the user
CREATE TABLE IF NOT EXISTS andy_prediction_game (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_session_id UUID NOT NULL, -- groups 10 questions together
  session_number INT NOT NULL, -- 1-4 per day
  game_date DATE NOT NULL,
  question_number INT NOT NULL, -- 1-10
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'multiple_choice', 'yes_no', 'scale'
  options JSONB, -- for multiple choice: ["option1", "option2", ...]
  andy_prediction TEXT NOT NULL, -- what Andy thinks user will say
  andy_confidence NUMERIC NOT NULL, -- 0.0-1.0
  based_on_memories UUID[], -- which memories informed this prediction
  based_on_analysis TEXT, -- Andy's reasoning
  user_actual_answer TEXT, -- what user actually answered
  answered_at TIMESTAMPTZ,
  is_correct BOOLEAN, -- did Andy predict correctly?
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Andy's prediction accuracy tracking
CREATE TABLE IF NOT EXISTS andy_prediction_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  category TEXT NOT NULL, -- 'overall', 'preferences', 'goals', 'patterns', etc.
  total_predictions INT DEFAULT 0,
  correct_predictions INT DEFAULT 0,
  accuracy_rate NUMERIC, -- correct/total
  confidence_avg NUMERIC, -- average confidence when correct
  learning_insights JSONB, -- what Andy learned from mistakes
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, stat_date, category)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_combined_files_user ON combined_memory_files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_combined_files_path ON combined_memory_files(user_id, file_path);
CREATE INDEX IF NOT EXISTS idx_combined_files_parent ON combined_memory_files(parent_file_id);

CREATE INDEX IF NOT EXISTS idx_prediction_game_user ON andy_prediction_game(user_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_game_session ON andy_prediction_game(game_session_id);
CREATE INDEX IF NOT EXISTS idx_prediction_game_unanswered ON andy_prediction_game(user_id, answered_at) WHERE answered_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prediction_stats_user ON andy_prediction_stats(user_id, stat_date DESC);

-- RLS policies
ALTER TABLE combined_memory_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE andy_prediction_game ENABLE ROW LEVEL SECURITY;
ALTER TABLE andy_prediction_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their combined memory files"
  ON combined_memory_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their prediction games"
  ON andy_prediction_game FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their answers"
  ON andy_prediction_game FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their prediction stats"
  ON andy_prediction_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all
CREATE POLICY "Service can manage combined files"
  ON combined_memory_files FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service can manage prediction game"
  ON andy_prediction_game FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service can manage prediction stats"
  ON andy_prediction_stats FOR ALL
  USING (true) WITH CHECK (true);

-- Function to calculate prediction accuracy
CREATE OR REPLACE FUNCTION update_prediction_accuracy(p_user_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
  -- Update overall accuracy
  INSERT INTO andy_prediction_stats (user_id, stat_date, category, total_predictions, correct_predictions, accuracy_rate, confidence_avg)
  SELECT 
    p_user_id,
    p_date,
    'overall',
    COUNT(*),
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END),
    CASE WHEN COUNT(*) > 0 THEN SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) ELSE 0 END,
    AVG(CASE WHEN is_correct THEN andy_confidence ELSE NULL END)
  FROM andy_prediction_game
  WHERE user_id = p_user_id 
    AND game_date = p_date
    AND answered_at IS NOT NULL
  ON CONFLICT (user_id, stat_date, category) DO UPDATE
  SET 
    total_predictions = EXCLUDED.total_predictions,
    correct_predictions = EXCLUDED.correct_predictions,
    accuracy_rate = EXCLUDED.accuracy_rate,
    confidence_avg = EXCLUDED.confidence_avg,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;