-- Super admin guardrail controls
CREATE TABLE IF NOT EXISTS public.super_admin_guardrails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  civic_integrity_enabled boolean NOT NULL DEFAULT true,
  toxicity_filter_enabled boolean NOT NULL DEFAULT true,
  harm_prevention_enabled boolean NOT NULL DEFAULT true,
  manipulation_detection_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS: only super admins can read/write their own settings
ALTER TABLE public.super_admin_guardrails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_guardrails_own"
ON public.super_admin_guardrails
FOR ALL
USING (auth.uid() = user_id AND public.is_super_admin())
WITH CHECK (auth.uid() = user_id AND public.is_super_admin());

-- Function to get guardrail settings (with defaults)
CREATE OR REPLACE FUNCTION public.get_guardrail_settings(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
      'civic_integrity_enabled', civic_integrity_enabled,
      'toxicity_filter_enabled', toxicity_filter_enabled,
      'harm_prevention_enabled', harm_prevention_enabled,
      'manipulation_detection_enabled', manipulation_detection_enabled
    )
    FROM public.super_admin_guardrails
    WHERE user_id = p_user_id),
    -- Defaults for non-super-admins or when no settings exist
    jsonb_build_object(
      'civic_integrity_enabled', true,
      'toxicity_filter_enabled', true,
      'harm_prevention_enabled', true,
      'manipulation_detection_enabled', true
    )
  );
$$;

CREATE INDEX IF NOT EXISTS idx_super_admin_guardrails_user ON public.super_admin_guardrails(user_id);