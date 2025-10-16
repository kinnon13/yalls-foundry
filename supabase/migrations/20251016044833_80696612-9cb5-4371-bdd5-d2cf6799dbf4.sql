-- Create privacy settings table
CREATE TABLE public.ai_user_privacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  hidden_from_admins BOOLEAN DEFAULT false,
  hidden_from_specific_admins UUID[] DEFAULT '{}',
  managed_by_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_user_privacy ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all privacy settings
CREATE POLICY "Super admins can manage all privacy"
ON public.ai_user_privacy
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Admins can manage their own privacy (but not if managed by super admin)
CREATE POLICY "Admins can manage own privacy"
ON public.ai_user_privacy
FOR ALL
USING (
  auth.uid() = user_id 
  AND is_admin(auth.uid())
  AND NOT managed_by_super_admin
)
WITH CHECK (
  auth.uid() = user_id 
  AND is_admin(auth.uid())
  AND NOT managed_by_super_admin
);

-- Users can view their own privacy settings
CREATE POLICY "Users can view own privacy"
ON public.ai_user_privacy
FOR SELECT
USING (auth.uid() = user_id);

-- Create helper function to check if a user is hidden from an admin
CREATE OR REPLACE FUNCTION public.is_user_hidden_from_admin(_user_id UUID, _admin_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ai_user_privacy
    WHERE user_id = _user_id
    AND (
      hidden_from_admins = true
      OR _admin_id = ANY(hidden_from_specific_admins)
    )
  )
$$;

-- Create index for performance
CREATE INDEX idx_ai_user_privacy_user_id ON public.ai_user_privacy(user_id);
CREATE INDEX idx_ai_user_privacy_hidden_from_admins ON public.ai_user_privacy(hidden_from_admins);