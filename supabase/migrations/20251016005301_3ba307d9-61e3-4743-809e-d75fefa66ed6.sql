-- Feature Flags System for Dynamic Platform
-- Enables/disables features in real-time without redeployment

CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}',
  category text DEFAULT 'general',
  enabled_for_tenants uuid[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Admins can manage feature flags
CREATE POLICY "Admins can manage feature flags"
ON feature_flags FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Everyone can view feature flags (to check if features are enabled)
CREATE POLICY "Everyone can view feature flags"
ON feature_flags FOR SELECT
USING (true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

-- Enable realtime updates
ALTER PUBLICATION supabase_realtime ADD TABLE feature_flags;

-- Insert demo feature flags to test the system
INSERT INTO feature_flags (feature_key, name, description, enabled, category, config) VALUES
  ('marketplace', 'Marketplace', 'Buy and sell horses, equipment, and services', true, 'commerce', '{"max_listings_per_user": 50}'),
  ('calendar', 'Event Calendar', 'Manage events, competitions, and schedules', true, 'scheduling', '{"max_events_per_user": 100}'),
  ('rocker_voice', 'Rocker Voice Chat', 'Real-time voice conversations with Rocker AI', false, 'ai', '{"model": "gpt-4", "voice": "alloy"}'),
  ('advanced_analytics', 'Advanced Analytics', 'Detailed insights and business intelligence', false, 'analytics', '{"refresh_interval": 300}'),
  ('mlm_network', 'MLM Network', 'Multi-level marketing and referral system', true, 'business', '{"max_depth": 10}'),
  ('live_streaming', 'Live Streaming', 'Stream events and training sessions', false, 'media', '{"max_viewers": 1000}'),
  ('payment_processing', 'Payment Processing', 'Integrated payment and invoicing', true, 'commerce', '{"processor": "stripe"}'),
  ('mobile_app', 'Mobile App', 'Native mobile application features', false, 'platform', '{"ios": true, "android": true}')
ON CONFLICT (feature_key) DO NOTHING;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_flags_updated_at
BEFORE UPDATE ON feature_flags
FOR EACH ROW
EXECUTE FUNCTION update_feature_flags_updated_at();