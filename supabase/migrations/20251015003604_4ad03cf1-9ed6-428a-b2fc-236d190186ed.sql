-- Create trigger to auto-assign admin role to first user (kinnonpeck@gmail.com)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-assign admin role to kinnonpeck@gmail.com
  IF NEW.email = 'kinnonpeck@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (NEW.id, 'admin', NEW.id);
  ELSE
    -- Default role for other users
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (NEW.id, 'user', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();