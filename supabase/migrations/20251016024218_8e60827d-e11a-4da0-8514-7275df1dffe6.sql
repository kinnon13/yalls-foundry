-- Selector memory tables for Rocker learning

-- 1) Per-user selector memory
CREATE TABLE IF NOT EXISTS ai_selector_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  target_name TEXT NOT NULL,
  selector TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0.0,
  successes INT NOT NULL DEFAULT 0,
  failures INT NOT NULL DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ DEFAULT now(),
  meta JSONB DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_selector_memory_uq
  ON ai_selector_memory (user_id, route, target_name);
CREATE INDEX IF NOT EXISTS ai_selector_memory_route_idx
  ON ai_selector_memory (route, target_name) INCLUDE (selector, score);

ALTER TABLE ai_selector_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own selector memory"
ON ai_selector_memory FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2) Global selector catalog (promoted selectors)
CREATE TABLE IF NOT EXISTS ai_selector_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL,
  target_name TEXT NOT NULL,
  selector TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0.0,
  votes INT NOT NULL DEFAULT 0,
  meta JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_selector_catalog_uq
  ON ai_selector_catalog (route, target_name);

ALTER TABLE ai_selector_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read global catalog"
ON ai_selector_catalog FOR SELECT
USING (true);

CREATE POLICY "Admins can manage catalog"
ON ai_selector_catalog FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3) Learning RPCs

-- Upsert per-user memory
CREATE OR REPLACE FUNCTION ai_mem_upsert(
  p_route TEXT, 
  p_target TEXT, 
  p_selector TEXT, 
  p_meta JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO ai_selector_memory (user_id, route, target_name, selector, score, meta, successes)
  VALUES (auth.uid(), p_route, p_target, p_selector, 0.6, COALESCE(p_meta,'{}'::jsonb), 1)
  ON CONFLICT (user_id, route, target_name)
  DO UPDATE SET 
    selector = EXCLUDED.selector,
    score = LEAST(1.0, ai_selector_memory.score + 0.2),
    successes = ai_selector_memory.successes + 1,
    last_success_at = now(),
    last_attempt_at = now(),
    meta = ai_selector_memory.meta || EXCLUDED.meta;
END $$;

-- Record success/failure to adjust score
CREATE OR REPLACE FUNCTION ai_mem_mark(
  p_route TEXT, 
  p_target TEXT, 
  p_success BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  UPDATE ai_selector_memory
  SET successes = successes + CASE WHEN p_success THEN 1 ELSE 0 END,
      failures = failures + CASE WHEN p_success THEN 0 ELSE 1 END,
      score = GREATEST(0, LEAST(1, score + CASE WHEN p_success THEN 0.1 ELSE -0.15 END)),
      last_success_at = CASE WHEN p_success THEN now() ELSE last_success_at END,
      last_attempt_at = now()
  WHERE user_id = auth.uid() 
    AND route = p_route 
    AND target_name = p_target;
END $$;

-- Read best selector: prefer user, fallback global
CREATE OR REPLACE FUNCTION ai_mem_get(
  p_route TEXT, 
  p_target TEXT
) RETURNS TABLE(source TEXT, selector TEXT, score REAL) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT 'user'::TEXT, m.selector, m.score
  FROM ai_selector_memory m
  WHERE m.user_id = auth.uid() 
    AND m.route = p_route 
    AND m.target_name = p_target
  UNION ALL
  SELECT 'global'::TEXT, c.selector, c.score
  FROM ai_selector_catalog c
  WHERE c.route = p_route 
    AND c.target_name = p_target
  ORDER BY score DESC
  LIMIT 1;
$$;

-- Promote to global when strong
CREATE OR REPLACE FUNCTION ai_mem_promote(
  p_route TEXT, 
  p_target TEXT
) RETURNS VOID
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  SELECT selector, score
  INTO rec
  FROM ai_selector_memory
  WHERE user_id = auth.uid() 
    AND route = p_route 
    AND target_name = p_target;

  IF rec.selector IS NULL OR rec.score < 0.8 THEN
    RETURN;
  END IF;

  INSERT INTO ai_selector_catalog (route, target_name, selector, score, votes, meta)
  VALUES (p_route, p_target, rec.selector, rec.score, 1, '{}'::jsonb)
  ON CONFLICT (route, target_name)
  DO UPDATE SET
    selector = EXCLUDED.selector,
    score = EXCLUDED.score,
    votes = ai_selector_catalog.votes + 1,
    updated_at = now();
END $$;