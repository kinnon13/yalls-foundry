-- Create rocker_insights table for Step 2: Data Analysis for Insights
CREATE TABLE IF NOT EXISTS public.rocker_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pattern', 'opportunity', 'reminder', 'task', 'risk')),
  title TEXT NOT NULL,
  description TEXT,
  action TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  confidence DECIMAL(3,2) DEFAULT 0.7 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT DEFAULT 'auto_analysis',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'completed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.rocker_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights"
  ON public.rocker_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON public.rocker_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert insights"
  ON public.rocker_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_rocker_insights_user_status ON public.rocker_insights(user_id, status);
CREATE INDEX idx_rocker_insights_priority ON public.rocker_insights(priority, created_at);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_rocker_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rocker_insights_updated_at
  BEFORE UPDATE ON public.rocker_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_rocker_insights_updated_at();