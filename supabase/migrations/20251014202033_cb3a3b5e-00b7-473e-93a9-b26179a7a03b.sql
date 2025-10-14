-- Core schema for yalls.ai Day-0
-- Tables: profiles, businesses, events
-- RLS: deny-by-default with owner/admin access patterns
-- Indexes: optimized for common query patterns

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Index for user_id lookups
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- ============================================
-- BUSINESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "Businesses are viewable by everyone"
  ON public.businesses FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create businesses"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = created_by AND auth.uid() = owner_id);

CREATE POLICY "Owners can update their businesses"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their businesses"
  ON public.businesses FOR DELETE
  USING (auth.uid() = owner_id);

-- Indexes for businesses
CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX idx_businesses_created_by ON public.businesses(created_by);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Event creators can update their events"
  ON public.events FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Event creators can delete their events"
  ON public.events FOR DELETE
  USING (auth.uid() = created_by);

-- Indexes for events
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_starts_at ON public.events(starts_at);
CREATE INDEX idx_events_business_id ON public.events(business_id);
CREATE INDEX idx_events_created_by ON public.events(created_by);

-- ============================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();