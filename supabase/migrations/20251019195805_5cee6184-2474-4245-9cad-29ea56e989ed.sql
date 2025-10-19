-- Master Migration v2: Fixed column names and table checks

-- Part 1: Rate limiting
DROP FUNCTION IF EXISTS public.bump_counter(text, integer);

CREATE TABLE IF NOT EXISTS public.kv_counters(
  k text PRIMARY KEY,
  v bigint NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour')
);

CREATE OR REPLACE FUNCTION public.bump_counter(p_key text, p_ttl_sec int DEFAULT 3600)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n bigint;
BEGIN
  INSERT INTO kv_counters(k,v,expires_at)
  VALUES (p_key,1, now() + make_interval(secs => p_ttl_sec))
  ON CONFLICT (k) DO UPDATE
    SET v = kv_counters.v + 1,
        expires_at = GREATEST(EXCLUDED.expires_at, kv_counters.expires_at)
  RETURNING v INTO n;
  RETURN n;
END $$;

-- Part 2: User Acquisition (new table)
CREATE TABLE IF NOT EXISTS public.user_acquisition (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by_kind TEXT CHECK (invited_by_kind IN ('user','entity','other','unknown')),
  invited_by_id UUID,
  invite_code TEXT,
  invite_medium TEXT,
  utm JSONB DEFAULT '{}',
  ref_session_id TEXT,
  first_touch_ts TIMESTAMPTZ DEFAULT now(),
  last_touch_ts TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_acquisition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acquisition.select.self" ON public.user_acquisition
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "acquisition.insert.self" ON public.user_acquisition
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "acquisition.update.self" ON public.user_acquisition
  FOR UPDATE USING (auth.uid() = user_id);

-- Part 3: Commission policy
CREATE TABLE IF NOT EXISTS public.commission_policy(
  id BOOL PRIMARY KEY DEFAULT TRUE,
  self_referral_allowed BOOLEAN DEFAULT FALSE,
  min_payout_cents INTEGER DEFAULT 500,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.commission_policy(id) VALUES(TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.commission_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy.select.all" ON public.commission_policy
  FOR SELECT USING (true);

-- Part 4: Multi-currency on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS fx_rate NUMERIC(12,6) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS total_usd_cents INT;

-- Part 5: Commission ledger reversals
ALTER TABLE public.commission_ledger
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reversal_of_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'commission_ledger_reversal_of_id_fkey'
  ) THEN
    ALTER TABLE public.commission_ledger
      ADD CONSTRAINT commission_ledger_reversal_of_id_fkey
      FOREIGN KEY (reversal_of_id) REFERENCES public.commission_ledger(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_commission_reversal
  ON public.commission_ledger(reversal_of_id);

-- Part 6: Layout uniqueness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uniq_user_app'
  ) THEN
    ALTER TABLE public.user_app_layout
      ADD CONSTRAINT uniq_user_app UNIQUE (user_id, app_id);
  END IF;
END $$;