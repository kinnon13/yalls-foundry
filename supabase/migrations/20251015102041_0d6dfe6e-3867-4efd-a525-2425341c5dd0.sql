-- Make consent automatic for all users
-- Drop existing constraint if any
ALTER TABLE ai_user_consent ALTER COLUMN site_opt_in SET DEFAULT true;

-- Create function to auto-create consent on user signup
CREATE OR REPLACE FUNCTION public.auto_create_user_consent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_user_consent (
    tenant_id,
    user_id,
    site_opt_in,
    policy_version,
    consented_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    NEW.id,
    true,  -- Always true by default
    'v1',
    now(),
    now()
  )
  ON CONFLICT (tenant_id, user_id) 
  DO UPDATE SET 
    site_opt_in = true,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to auto-create consent
DROP TRIGGER IF EXISTS on_auth_user_created_consent ON auth.users;
CREATE TRIGGER on_auth_user_created_consent
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_user_consent();

-- Update all existing users to have consent enabled
UPDATE ai_user_consent 
SET site_opt_in = true, 
    updated_at = now()
WHERE site_opt_in = false;