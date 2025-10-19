-- 1. Add RLS policies for user_apps and user_app_layout
ALTER TABLE user_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own apps"
ON user_apps FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE user_app_layout ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own layout"
ON user_app_layout FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Create apps catalog table
CREATE TABLE IF NOT EXISTS apps (
  id text PRIMARY KEY,
  name text NOT NULL,
  tagline text,
  icon_url text,
  deeplink_template text NOT NULL DEFAULT '/?app={id}',
  is_core boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Seed core apps
INSERT INTO apps (id, name, tagline, icon_url, is_core) VALUES
  ('orders', 'Orders', 'Manage orders and fulfillment', '📦', true),
  ('calendar', 'Calendar', 'Events and scheduling', '📅', true),
  ('marketplace', 'Marketplace', 'Browse and sell products', '🛍️', true),
  ('messages', 'Messages', 'Direct messaging', '💬', true),
  ('earnings', 'Earnings', 'Track commissions and payouts', '💰', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on apps (public read)
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view apps"
ON apps FOR SELECT
USING (true);