-- Enable RLS on all new tables
ALTER TABLE public.user_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_app_layout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rocker_conversations ENABLE ROW LEVEL SECURITY;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END $$;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_user_app_layout_timestamp ON public.user_app_layout;
CREATE TRIGGER update_user_app_layout_timestamp
BEFORE UPDATE ON public.user_app_layout
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_rocker_conversations_timestamp ON public.rocker_conversations;
CREATE TRIGGER update_rocker_conversations_timestamp
BEFORE UPDATE ON public.rocker_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Add unique constraint for layout to prevent dupes
ALTER TABLE public.user_app_layout
DROP CONSTRAINT IF EXISTS uniq_layout;
ALTER TABLE public.user_app_layout
ADD CONSTRAINT uniq_layout UNIQUE (user_id, app_id);

-- Counter table for rate limiting
CREATE TABLE IF NOT EXISTS public.kv_counters(
  k text PRIMARY KEY,
  v bigint NOT NULL DEFAULT 0,
  expires_at timestamptz
);

CREATE OR REPLACE FUNCTION public.bump_counter(p_key text, p_ttl_sec int DEFAULT 60)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n bigint;
BEGIN
  INSERT INTO kv_counters(k, v, expires_at) 
  VALUES(p_key, 1, now() + make_interval(secs=>p_ttl_sec))
  ON CONFLICT (k) DO UPDATE 
  SET v = kv_counters.v + 1, 
      expires_at = GREATEST(EXCLUDED.expires_at, kv_counters.expires_at)
  RETURNING v INTO n;
  RETURN n;
END $$;

-- Telemetry events table
CREATE TABLE IF NOT EXISTS public.rocker_events(
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  session_id text,
  ts timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rocker_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events" 
ON public.rocker_events
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own events"
ON public.rocker_events
FOR SELECT
USING (auth.uid() = user_id);

-- Add index only if ts column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rocker_events' 
    AND column_name = 'ts'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_re_user_ts ON public.rocker_events(user_id, ts DESC);
  END IF;
END $$;

-- Invite enforcement fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invite_source text;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS invited_by_self;
ALTER TABLE public.profiles
ADD CONSTRAINT invited_by_self CHECK (invited_by IS NULL OR invited_by <> user_id);