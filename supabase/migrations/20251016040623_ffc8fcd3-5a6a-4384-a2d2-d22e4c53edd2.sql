-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create or replace has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create or replace is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin'::app_role)
$$;

-- Drop and recreate is_admin with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

CREATE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('super_admin'::app_role, 'admin'::app_role)
  )
$$;

-- Recreate the policies that depended on is_admin
DROP POLICY IF EXISTS "memory_insert_requires_optin" ON public.ai_user_memory;
CREATE POLICY "memory_insert_requires_optin"
ON public.ai_user_memory
FOR INSERT
TO authenticated
WITH CHECK (has_site_opt_in(tenant_id, user_id) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "memory_select_requires_optin" ON public.ai_user_memory;
CREATE POLICY "memory_select_requires_optin"
ON public.ai_user_memory
FOR SELECT
TO authenticated
USING (has_site_opt_in(tenant_id, user_id) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles_update_requires_optin" ON public.profiles;
CREATE POLICY "profiles_update_requires_optin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR is_admin(auth.uid()));

-- Drop existing policies on user_roles if they exist
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view admin and moderator roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can grant any role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can grant moderator role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can revoke any role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can revoke moderator role" ON public.user_roles;

-- RLS Policies for user_roles
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can view admin and moderator roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND role IN ('admin'::app_role, 'moderator'::app_role)
);

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can grant any role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can grant moderator role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND role = 'moderator'::app_role
);

CREATE POLICY "Super admins can revoke any role"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can revoke moderator role"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND role = 'moderator'::app_role
);