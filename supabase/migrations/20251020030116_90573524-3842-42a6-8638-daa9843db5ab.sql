-- Web access runtime flags
CREATE TABLE IF NOT EXISTS runtime_flags (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE runtime_flags ENABLE ROW LEVEL SECURITY;

-- Admins can manage flags
CREATE POLICY "Admins manage flags" ON runtime_flags
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert web access flags
INSERT INTO runtime_flags(key, value) VALUES
  ('capabilities.web_access', '{"enabled": true, "mode": "allowlist"}'::jsonb),
  ('rocker.restrictions', '{"enabled": true, "safe_mode": "standard"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Web access allowlist
CREATE TABLE IF NOT EXISTS web_access_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE web_access_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage allowlist" ON web_access_allowlist
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Web access blocklist
CREATE TABLE IF NOT EXISTS web_access_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE web_access_blocklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage blocklist" ON web_access_blocklist
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed with safe defaults
INSERT INTO web_access_allowlist (domain, note) VALUES
  ('docs.google.com', 'Google Docs'),
  ('github.com', 'GitHub'),
  ('news.ycombinator.com', 'Hacker News'),
  ('wikipedia.org', 'Wikipedia')
ON CONFLICT DO NOTHING;