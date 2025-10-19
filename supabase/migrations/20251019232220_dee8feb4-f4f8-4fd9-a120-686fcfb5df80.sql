-- Super Admin Settings Table (completely separate from regular admin)
CREATE TABLE IF NOT EXISTS public.super_admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rocker capability toggles
  allow_secure_credentials boolean NOT NULL DEFAULT false,
  allow_voice_calls boolean NOT NULL DEFAULT false,
  allow_voice_messages boolean NOT NULL DEFAULT false,
  allow_web_automation boolean NOT NULL DEFAULT false,
  allow_autonomous_actions boolean NOT NULL DEFAULT false,
  allow_email_sending boolean NOT NULL DEFAULT false,
  allow_calendar_access boolean NOT NULL DEFAULT false,
  allow_file_operations boolean NOT NULL DEFAULT false,
  allow_crm_operations boolean NOT NULL DEFAULT false,
  allow_financial_operations boolean NOT NULL DEFAULT false,
  
  -- Rocker obedience protocol
  rocker_obedience_level text NOT NULL DEFAULT 'absolute',
  rocker_can_refuse_commands boolean NOT NULL DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.super_admin_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can access their own settings
CREATE POLICY "Super admins can manage their own settings"
ON public.super_admin_settings
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  AND public.is_super_admin(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_super_admin(auth.uid())
);

-- Function to check if super admin has capability enabled
CREATE OR REPLACE FUNCTION public.super_admin_has_capability(
  _user_id uuid,
  _capability text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _capability
    WHEN 'secure_credentials' THEN COALESCE(allow_secure_credentials, false)
    WHEN 'voice_calls' THEN COALESCE(allow_voice_calls, false)
    WHEN 'voice_messages' THEN COALESCE(allow_voice_messages, false)
    WHEN 'web_automation' THEN COALESCE(allow_web_automation, false)
    WHEN 'autonomous_actions' THEN COALESCE(allow_autonomous_actions, false)
    WHEN 'email_sending' THEN COALESCE(allow_email_sending, false)
    WHEN 'calendar_access' THEN COALESCE(allow_calendar_access, false)
    WHEN 'file_operations' THEN COALESCE(allow_file_operations, false)
    WHEN 'crm_operations' THEN COALESCE(allow_crm_operations, false)
    WHEN 'financial_operations' THEN COALESCE(allow_financial_operations, false)
    ELSE false
  END
  FROM public.super_admin_settings
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_super_admin_settings_updated_at
  BEFORE UPDATE ON public.super_admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();