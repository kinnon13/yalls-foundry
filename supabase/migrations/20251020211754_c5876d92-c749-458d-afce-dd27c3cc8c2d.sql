-- Deep Analysis Storage for God-Level Filing

CREATE TABLE IF NOT EXISTS public.rocker_deep_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id uuid,
  content_preview text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  filing_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_option integer,
  status text NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'filed', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.rocker_deep_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deep analysis"
  ON public.rocker_deep_analysis
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deep analysis"
  ON public.rocker_deep_analysis
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deep analysis"
  ON public.rocker_deep_analysis
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_rocker_deep_analysis_user_thread 
  ON public.rocker_deep_analysis(user_id, thread_id);

CREATE INDEX IF NOT EXISTS idx_rocker_deep_analysis_status 
  ON public.rocker_deep_analysis(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_rocker_deep_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_rocker_deep_analysis_updated_at
  BEFORE UPDATE ON public.rocker_deep_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_rocker_deep_analysis_updated_at();