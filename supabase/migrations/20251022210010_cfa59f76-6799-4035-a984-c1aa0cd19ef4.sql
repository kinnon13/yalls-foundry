-- Dynamic Home: Referral tracking and marketing analytics
-- Step 2: Database schema for invite personalization and A/B testing

-- 1) Add invite code and public profile fields to ai_user_profiles
ALTER TABLE ai_user_profiles
  ADD COLUMN IF NOT EXISTS invite_code TEXT,
  ADD COLUMN IF NOT EXISTS public_interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS share_name BOOLEAN DEFAULT false;

-- Create unique index on invite_code
CREATE UNIQUE INDEX IF NOT EXISTS ai_user_profiles_invite_code_key 
  ON ai_user_profiles(invite_code);

-- Create function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := substr(md5(NEW.id::text || NOW()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invite codes
DROP TRIGGER IF EXISTS set_invite_code ON ai_user_profiles;
CREATE TRIGGER set_invite_code
  BEFORE INSERT ON ai_user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_invite_code();

-- Backfill existing rows with invite codes
UPDATE ai_user_profiles
SET invite_code = substr(md5(id::text || created_at::text), 1, 8)
WHERE invite_code IS NULL;

-- 2) Marketing events table for landing page analytics
CREATE TABLE IF NOT EXISTS marketing_events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ DEFAULT NOW(),
  trace_id TEXT,
  session_id TEXT,
  event_type TEXT CHECK (event_type IN (
    'home_impression',
    'cta_click', 
    'signup_start',
    'signup_complete'
  )),
  variant TEXT,
  invite_code TEXT,
  referrer TEXT,
  user_agent TEXT,
  extras JSONB DEFAULT '{}'
);

-- 3) Enable RLS on marketing_events (allow anonymous inserts for tracking)
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketing_events_insert_policy ON marketing_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Grant insert to anon, revoke select
GRANT INSERT ON marketing_events TO anon;
REVOKE SELECT ON marketing_events FROM anon;

-- 4) Indexes for analytics queries
CREATE INDEX IF NOT EXISTS marketing_events_ts_idx ON marketing_events(ts);
CREATE INDEX IF NOT EXISTS marketing_events_event_idx ON marketing_events(event_type);
CREATE INDEX IF NOT EXISTS marketing_events_invite_idx ON marketing_events(invite_code);
CREATE INDEX IF NOT EXISTS marketing_events_variant_idx ON marketing_events(variant);

-- 5) Optional: experiments registry table (can use JSON file instead)
CREATE TABLE IF NOT EXISTS experiments (
  key TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment with migration purpose
COMMENT ON TABLE marketing_events IS 'Landing page analytics for A/B testing and referral tracking';
COMMENT ON COLUMN ai_user_profiles.invite_code IS 'Auto-generated shareable invite code';
COMMENT ON COLUMN ai_user_profiles.public_interests IS 'Public interests for landing page personalization';