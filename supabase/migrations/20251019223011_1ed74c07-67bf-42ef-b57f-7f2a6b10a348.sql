-- Add constraint checks for learning_events (reward, p_exp, score ranges)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_reward_range' 
    AND conrelid = 'public.learning_events'::regclass
  ) THEN
    ALTER TABLE public.learning_events
      ADD CONSTRAINT chk_reward_range CHECK (reward IS NULL OR (reward >= 0 AND reward <= 1));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_p_exp_range' 
    AND conrelid = 'public.learning_events'::regclass
  ) THEN
    ALTER TABLE public.learning_events
      ADD CONSTRAINT chk_p_exp_range CHECK (p_exp >= 0 AND p_exp <= 1);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_score_range' 
    AND conrelid = 'public.learning_events'::regclass
  ) THEN
    ALTER TABLE public.learning_events
      ADD CONSTRAINT chk_score_range CHECK (score IS NULL OR (score >= -1000000 AND score <= 1000000));
  END IF;
END $$;

-- Events Queue Health View
CREATE OR REPLACE VIEW public.vw_events_queue_health AS
SELECT topic, status,
       COUNT(*) AS ct,
       percentile_disc(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (now() - created_at))) AS p95_age_sec,
       MAX(updated_at) AS last_activity
FROM public.events_queue
GROUP BY topic, status;

ALTER VIEW public.vw_events_queue_health SET (security_invoker = on);