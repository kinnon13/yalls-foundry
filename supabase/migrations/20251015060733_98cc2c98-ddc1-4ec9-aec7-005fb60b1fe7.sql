
-- Fix Security Issues: Enable RLS and add policies for exposed tables

-- 1. Enable RLS on ai_policy_config (tenant configuration)
ALTER TABLE public.ai_policy_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify AI policy config
CREATE POLICY "Admins can manage AI policy config"
ON public.ai_policy_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Add RLS policies for entity_profiles partition tables
-- These tables store public profiles (horses, riders, etc.)

-- Policy for entity_profiles_2025_01
CREATE POLICY "Anyone can view entity profiles"
ON public.entity_profiles_2025_01
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Owners can update their own profiles"
ON public.entity_profiles_2025_01
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all profiles"
ON public.entity_profiles_2025_01
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy for entity_profiles_2025_02
CREATE POLICY "Anyone can view entity profiles"
ON public.entity_profiles_2025_02
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Owners can update their own profiles"
ON public.entity_profiles_2025_02
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all profiles"
ON public.entity_profiles_2025_02
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy for entity_profiles_2025_03
CREATE POLICY "Anyone can view entity profiles"
ON public.entity_profiles_2025_03
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Owners can update their own profiles"
ON public.entity_profiles_2025_03
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all profiles"
ON public.entity_profiles_2025_03
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Note: spatial_ref_sys is a PostGIS reference table and doesn't need RLS
-- It contains public spatial reference system definitions
