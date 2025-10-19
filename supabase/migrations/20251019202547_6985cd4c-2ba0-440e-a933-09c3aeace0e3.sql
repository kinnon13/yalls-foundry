-- ============================================================================
-- Task 2: Onboarding Schema Migration
-- Adds all tables, columns, RPC functions, and seed data for onboarding flow
-- ============================================================================

-- 1. Extend profiles table with onboarding fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Index for handle lookups
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle);

-- 2. Create business_profiles table
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('seller','barn','trainer','shop')),
  name TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_owner ON public.business_profiles(owner_user_id);

-- Enable RLS on business_profiles
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for business_profiles
CREATE POLICY "Users can view their own business profiles"
  ON public.business_profiles FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert their own business profiles"
  ON public.business_profiles FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own business profiles"
  ON public.business_profiles FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- 3. Create interests_catalog table
CREATE TABLE IF NOT EXISTS public.interests_catalog (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  tag TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Enable RLS (public read)
ALTER TABLE public.interests_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view interests catalog"
  ON public.interests_catalog FOR SELECT
  USING (true);

-- Seed interests data
INSERT INTO public.interests_catalog (id, category, tag, sort_order) VALUES
  ('discipline_dressage', 'Disciplines', 'Dressage', 10),
  ('discipline_jumping', 'Disciplines', 'Show Jumping', 20),
  ('discipline_eventing', 'Disciplines', 'Eventing', 30),
  ('discipline_hunter', 'Disciplines', 'Hunter', 40),
  ('discipline_western', 'Disciplines', 'Western', 50),
  ('discipline_trail', 'Disciplines', 'Trail Riding', 60),
  ('breed_thoroughbred', 'Breeds', 'Thoroughbred', 100),
  ('breed_quarter', 'Breeds', 'Quarter Horse', 110),
  ('breed_warmblood', 'Breeds', 'Warmblood', 120),
  ('breed_arabian', 'Breeds', 'Arabian', 130),
  ('breed_paint', 'Breeds', 'Paint', 140),
  ('breed_appaloosa', 'Breeds', 'Appaloosa', 150),
  ('interest_tack', 'Interests', 'Tack & Equipment', 200),
  ('interest_training', 'Interests', 'Training', 210),
  ('interest_health', 'Interests', 'Horse Health', 220),
  ('interest_breeding', 'Interests', 'Breeding', 230),
  ('interest_showing', 'Interests', 'Horse Shows', 240),
  ('interest_photography', 'Interests', 'Equine Photography', 250),
  ('interest_rescue', 'Interests', 'Horse Rescue', 260),
  ('interest_youth', 'Interests', 'Youth Programs', 270)
ON CONFLICT (id) DO NOTHING;

-- 4. Create profiles_onboarding_progress table (resume state)
CREATE TABLE IF NOT EXISTS public.profiles_onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own onboarding progress"
  ON public.profiles_onboarding_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Create user_acquisition table
CREATE TABLE IF NOT EXISTS public.user_acquisition (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by_kind TEXT CHECK (invited_by_kind IN ('user','entity','other')),
  invited_by_id UUID,
  invite_code TEXT,
  invite_medium TEXT,
  utm JSONB DEFAULT '{}'::jsonb,
  ref_session_id TEXT,
  first_touch_ts TIMESTAMPTZ DEFAULT now(),
  last_touch_ts TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_acquisition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own acquisition data"
  ON public.user_acquisition FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own acquisition data"
  ON public.user_acquisition FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own acquisition data"
  ON public.user_acquisition FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Create commission_policy table
CREATE TABLE IF NOT EXISTS public.commission_policy (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  self_referral_allowed BOOLEAN DEFAULT FALSE,
  CHECK (id = TRUE)
);

INSERT INTO public.commission_policy(id, self_referral_allowed) 
VALUES(TRUE, FALSE) 
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (admin only)
ALTER TABLE public.commission_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage commission policy"
  ON public.commission_policy FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  ));

-- 7. Create RPC: check_handle_available
CREATE OR REPLACE FUNCTION public.check_handle_available(p_handle TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserved TEXT[] := ARRAY['admin','root','support','help','api','www','mail','ftp','localhost','yalls','staff','team','official'];
BEGIN
  -- Check length
  IF LENGTH(p_handle) < 3 OR LENGTH(p_handle) > 20 THEN
    RETURN FALSE;
  END IF;

  -- Check format (lowercase alphanumeric, underscore, dot)
  IF p_handle !~ '^[a-z0-9_.]+$' THEN
    RETURN FALSE;
  END IF;

  -- Check for leading/trailing dots or double symbols
  IF p_handle ~ '^\.|\.$|__|\.\.|\._|_\.' THEN
    RETURN FALSE;
  END IF;

  -- Check reserved words
  IF p_handle = ANY(v_reserved) THEN
    RETURN FALSE;
  END IF;

  -- Check if already taken
  IF EXISTS (SELECT 1 FROM public.profiles WHERE handle = p_handle) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- 8. Create RPC: upsert_business_profile
CREATE OR REPLACE FUNCTION public.upsert_business_profile(
  p_kind TEXT,
  p_name TEXT,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Upsert business profile
  INSERT INTO public.business_profiles (owner_user_id, kind, name, meta)
  VALUES (auth.uid(), p_kind, p_name, COALESCE(p_meta, '{}'::jsonb))
  ON CONFLICT (owner_user_id) DO UPDATE
  SET kind = EXCLUDED.kind,
      name = EXCLUDED.name,
      meta = EXCLUDED.meta,
      updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Add unique constraint for business profiles (one per user)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_profiles_owner_unique'
  ) THEN
    ALTER TABLE public.business_profiles 
    ADD CONSTRAINT business_profiles_owner_unique UNIQUE (owner_user_id);
  END IF;
END $$;

-- 9. Create RPC: set_user_acquisition
CREATE OR REPLACE FUNCTION public.set_user_acquisition(p_payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind TEXT := p_payload->>'invited_by_kind';
  v_id UUID := (p_payload->>'invited_by_id')::UUID;
  v_self_ref_allowed BOOLEAN;
BEGIN
  -- Check self-referral
  IF v_kind = 'user' AND v_id = auth.uid() THEN
    SELECT self_referral_allowed INTO v_self_ref_allowed 
    FROM public.commission_policy WHERE id = TRUE;
    
    IF NOT COALESCE(v_self_ref_allowed, FALSE) THEN
      RAISE EXCEPTION 'self_referral_forbidden';
    END IF;
  END IF;

  -- Upsert acquisition data
  INSERT INTO public.user_acquisition (
    user_id,
    invited_by_kind,
    invited_by_id,
    invite_code,
    invite_medium,
    utm,
    ref_session_id,
    last_touch_ts
  )
  VALUES (
    auth.uid(),
    v_kind,
    v_id,
    p_payload->>'invite_code',
    p_payload->>'invite_medium',
    COALESCE(p_payload->'utm', '{}'::jsonb),
    p_payload->>'ref_session_id',
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET invited_by_kind = EXCLUDED.invited_by_kind,
      invited_by_id = EXCLUDED.invited_by_id,
      invite_code = EXCLUDED.invite_code,
      invite_medium = EXCLUDED.invite_medium,
      utm = EXCLUDED.utm,
      ref_session_id = EXCLUDED.ref_session_id,
      last_touch_ts = now();
END;
$$;

-- 10. Create RPC: complete_onboarding
CREATE OR REPLACE FUNCTION public.complete_onboarding()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate acquisition exists
  IF NOT EXISTS (
    SELECT 1 FROM public.user_acquisition 
    WHERE user_id = auth.uid()
    AND (
      invited_by_id IS NOT NULL 
      OR invite_code IS NOT NULL 
      OR utm::text != '{}'
    )
  ) THEN
    RAISE EXCEPTION 'acquisition_required';
  END IF;

  -- Mark onboarding complete
  UPDATE public.profiles
  SET onboarding_complete = TRUE
  WHERE user_id = auth.uid();

  -- Clean up progress table
  DELETE FROM public.profiles_onboarding_progress
  WHERE user_id = auth.uid();
END;
$$;

-- 11. Add trigger for business_profiles updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_business_profiles_updated_at
    BEFORE UPDATE ON public.business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;