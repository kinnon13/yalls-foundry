-- Create tour schedules table
CREATE TABLE IF NOT EXISTS public.tour_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stops JSONB NOT NULL DEFAULT '[]'::jsonb,
  trigger_event TEXT, -- 'onboarding', 'manual', 'scheduled', etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tour_schedules ENABLE ROW LEVEL SECURITY;

-- Admins can manage tour schedules
CREATE POLICY "Admins can manage tour schedules"
ON public.tour_schedules
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Everyone can view active tour schedules
CREATE POLICY "Everyone can view active tour schedules"
ON public.tour_schedules
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create index for faster queries
CREATE INDEX idx_tour_schedules_active ON public.tour_schedules(is_active);
CREATE INDEX idx_tour_schedules_trigger ON public.tour_schedules(trigger_event);