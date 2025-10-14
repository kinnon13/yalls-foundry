-- Phase 2: Business capabilities + staff access (fixed)
-- Ensure pg_trgm extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extend existing businesses table with capabilities
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS capabilities jsonb DEFAULT '[]'::jsonb;

-- Create GIN index on capabilities for fast JSONB queries
CREATE INDEX IF NOT EXISTS idx_businesses_capabilities ON public.businesses USING GIN(capabilities);

-- Create trigram index on slug + name for fuzzy search
CREATE INDEX IF NOT EXISTS idx_businesses_slug_name_trgm ON public.businesses USING GIN((slug || ' ' || name) gin_trgm_ops);

-- Create composite index for tenant sharding (tenant_id + created_at)
CREATE INDEX IF NOT EXISTS idx_businesses_owner_created ON public.businesses(owner_id, created_at);

-- Business team membership table (for staff/admin roles)
CREATE TABLE IF NOT EXISTS public.business_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'staff', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

ALTER TABLE public.business_team ENABLE ROW LEVEL SECURITY;

-- RLS: Team members can view their own membership
CREATE POLICY "Users can view their team memberships"
ON public.business_team FOR SELECT
USING (auth.uid() = user_id);

-- RLS: Business owners can manage team
CREATE POLICY "Business owners can manage team"
ON public.business_team FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_team.business_id 
    AND owner_id = auth.uid()
  )
);

-- Security definer function to check business membership
CREATE OR REPLACE FUNCTION public.is_biz_member(_business_id uuid, _user_id uuid, _min_role text DEFAULT 'viewer')
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Owner is always a member
  IF EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = _business_id 
    AND owner_id = _user_id
  ) THEN
    RETURN true;
  END IF;

  -- Check team membership with role
  RETURN EXISTS (
    SELECT 1 FROM public.business_team
    WHERE business_id = _business_id
    AND user_id = _user_id
    AND (
      (_min_role = 'viewer') OR
      (_min_role = 'staff' AND role IN ('staff', 'admin')) OR
      (_min_role = 'admin' AND role = 'admin')
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_biz_member TO anon, authenticated, service_role;

-- Update businesses RLS to include staff access
DROP POLICY IF EXISTS "Owners can update their businesses" ON public.businesses;
CREATE POLICY "Owners and staff can update businesses"
ON public.businesses FOR UPDATE
USING (auth.uid() = owner_id OR public.is_biz_member(id, auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Owners can delete their businesses" ON public.businesses;
CREATE POLICY "Owners can delete businesses"
ON public.businesses FOR DELETE
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_businesses_updated_at_trigger ON public.businesses;
CREATE TRIGGER update_businesses_updated_at_trigger
BEFORE UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.update_businesses_updated_at();