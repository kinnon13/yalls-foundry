-- Create Andy system rules table for hardwired instructions
CREATE TABLE IF NOT EXISTS andy_system_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE andy_system_rules ENABLE ROW LEVEL SECURITY;

-- Users can manage their own rules
CREATE POLICY "Users manage own rules" ON andy_system_rules
  FOR ALL USING (auth.uid() = user_id);

-- Create index for fast lookup
CREATE INDEX idx_andy_rules_user ON andy_system_rules(user_id, active);

-- Trigger for updated_at
CREATE TRIGGER update_andy_rules_updated_at
  BEFORE UPDATE ON andy_system_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();