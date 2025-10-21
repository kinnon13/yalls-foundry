-- Enable pgcrypto for sha256
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Game sessions
CREATE TABLE ai_game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  mode TEXT NOT NULL DEFAULT 'calibration', -- calibration | domination
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game sessions"
  ON ai_game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game sessions"
  ON ai_game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game sessions"
  ON ai_game_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- 2) Rounds (one question per round)
CREATE TYPE ai_game_kind AS ENUM ('yn', 'mcq', 'scale');

CREATE TABLE ai_game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_game_sessions(id) ON DELETE CASCADE,
  round_no INT NOT NULL,
  kind ai_game_kind NOT NULL,
  question_text TEXT NOT NULL,
  choices TEXT[] NULL,
  created_by TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'awaiting_commit',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, round_no)
);

ALTER TABLE ai_game_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rounds in their sessions"
  ON ai_game_rounds FOR SELECT
  USING (EXISTS (SELECT 1 FROM ai_game_sessions WHERE id = session_id AND user_id = auth.uid()));

CREATE POLICY "Users can create rounds in their sessions"
  ON ai_game_rounds FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM ai_game_sessions WHERE id = session_id AND user_id = auth.uid()));

CREATE POLICY "Users can update rounds in their sessions"
  ON ai_game_rounds FOR UPDATE
  USING (EXISTS (SELECT 1 FROM ai_game_sessions WHERE id = session_id AND user_id = auth.uid()));

-- 3) AI commit (blinded)
CREATE TABLE ai_prediction_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES ai_game_rounds(id) ON DELETE CASCADE,
  commit_hash TEXT NOT NULL,
  committed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id)
);

ALTER TABLE ai_prediction_commits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view commits in their rounds"
  ON ai_prediction_commits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM ai_game_rounds r
    JOIN ai_game_sessions s ON r.session_id = s.id
    WHERE r.id = round_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Service can create commits"
  ON ai_prediction_commits FOR INSERT
  WITH CHECK (true);

-- 4) User answer
CREATE TABLE ai_user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES ai_game_rounds(id) ON DELETE CASCADE,
  answer_index INT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id)
);

ALTER TABLE ai_user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own answers"
  ON ai_user_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM ai_game_rounds r
    JOIN ai_game_sessions s ON r.session_id = s.id
    WHERE r.id = round_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own answers"
  ON ai_user_answers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM ai_game_rounds r
    JOIN ai_game_sessions s ON r.session_id = s.id
    WHERE r.id = round_id AND s.user_id = auth.uid()
  ));

-- 5) AI reveal (verified against commit)
CREATE TABLE ai_prediction_reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES ai_game_rounds(id) ON DELETE CASCADE,
  prediction_json JSONB NOT NULL,
  salt TEXT NOT NULL,
  revealed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id)
);

ALTER TABLE ai_prediction_reveals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reveals in their rounds"
  ON ai_prediction_reveals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM ai_game_rounds r
    JOIN ai_game_sessions s ON r.session_id = s.id
    WHERE r.id = round_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Service can create reveals"
  ON ai_prediction_reveals FOR INSERT
  WITH CHECK (true);

-- 6) Scoring
CREATE TABLE ai_round_scores (
  round_id UUID PRIMARY KEY REFERENCES ai_game_rounds(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  log_loss DOUBLE PRECISION NOT NULL,
  brier DOUBLE PRECISION NOT NULL,
  confidence NUMERIC NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_round_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores in their rounds"
  ON ai_round_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM ai_game_rounds r
    JOIN ai_game_sessions s ON r.session_id = s.id
    WHERE r.id = round_id AND s.user_id = auth.uid()
  ));

-- 7) Question feedback
CREATE TABLE ai_question_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_game_sessions(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES ai_game_rounds(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_question_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create feedback for their sessions"
  ON ai_question_feedback FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM ai_game_sessions WHERE id = session_id AND user_id = auth.uid()));

-- Verify reveal matches commit hash and that the user already answered
CREATE OR REPLACE FUNCTION sp_reveal_prediction(
  p_round_id UUID,
  p_prediction_json JSONB,
  p_salt TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commit_hash TEXT;
  v_expected TEXT;
  v_has_answer BOOL;
BEGIN
  SELECT commit_hash INTO v_commit_hash
  FROM ai_prediction_commits WHERE round_id = p_round_id;

  IF v_commit_hash IS NULL THEN
    RAISE EXCEPTION 'No commit for round %', p_round_id USING errcode='22023';
  END IF;

  SELECT EXISTS(SELECT 1 FROM ai_user_answers WHERE round_id = p_round_id) INTO v_has_answer;
  IF NOT v_has_answer THEN
    RAISE EXCEPTION 'Cannot reveal before user answers' USING errcode='22023';
  END IF;

  -- recompute hash
  SELECT encode(digest((p_prediction_json::text || p_salt), 'sha256'), 'hex') INTO v_expected;

  IF v_expected != v_commit_hash THEN
    RAISE EXCEPTION 'Reveal does not match commit (hash mismatch)' USING errcode='22023';
  END IF;

  INSERT INTO ai_prediction_reveals(round_id, prediction_json, salt) VALUES
    (p_round_id, p_prediction_json, p_salt);

  UPDATE ai_game_rounds SET state = 'scored' WHERE id = p_round_id;
END $$;

-- Compute round score after reveal
CREATE OR REPLACE FUNCTION sp_score_round(p_round_id UUID) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ans INT;
  pred JSONB;
  probs DOUBLE PRECISION[];
  p DOUBLE PRECISION;
  brier DOUBLE PRECISION := 0;
  ll DOUBLE PRECISION;
  i INT;
  correct BOOL;
BEGIN
  SELECT answer_index INTO ans FROM ai_user_answers WHERE round_id = p_round_id;
  SELECT prediction_json INTO pred FROM ai_prediction_reveals WHERE round_id = p_round_id;

  IF ans IS NULL OR pred IS NULL THEN
    RAISE EXCEPTION 'Missing answer or reveal for round %', p_round_id;
  END IF;

  SELECT array(SELECT (x)::DOUBLE PRECISION FROM jsonb_array_elements_text(pred->'probs') AS t(x))
  INTO probs;

  p := probs[ans+1];
  correct := ( (pred->>'choice')::INT = ans );

  -- log loss (clip)
  ll := -ln(GREATEST(LEAST(p, 1-1e-12), 1e-12));

  -- brier
  FOR i IN 1..cardinality(probs) LOOP
    IF (i-1) = ans THEN
      brier := brier + POWER(probs[i] - 1, 2);
    ELSE
      brier := brier + POWER(probs[i] - 0, 2);
    END IF;
  END LOOP;

  INSERT INTO ai_round_scores(round_id, correct, log_loss, brier, confidence)
  VALUES (p_round_id, correct, ll, brier, p)
  ON CONFLICT (round_id) DO NOTHING;
END $$;