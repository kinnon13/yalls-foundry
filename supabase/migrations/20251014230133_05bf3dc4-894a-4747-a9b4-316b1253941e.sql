-- Phase 2: CRM Contacts + Activities (fixed)
-- Ensure pg_trgm extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'customer', 'vip', 'inactive')),
  notes text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, email)
);

-- Indexes for fast queries
CREATE INDEX idx_crm_contacts_business ON public.crm_contacts(business_id);
CREATE INDEX idx_crm_contacts_status ON public.crm_contacts(business_id, status);
CREATE INDEX idx_crm_contacts_name_trgm ON public.crm_contacts USING GIN((name || ' ' || COALESCE(email, '')) gin_trgm_ops);

-- Enable RLS
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

-- RLS: Business members can view contacts
CREATE POLICY "Business members can view contacts"
ON public.crm_contacts FOR SELECT
USING (public.is_biz_member(business_id, auth.uid(), 'viewer'));

-- RLS: Staff can insert contacts
CREATE POLICY "Business staff can insert contacts"
ON public.crm_contacts FOR INSERT
WITH CHECK (public.is_biz_member(business_id, auth.uid(), 'staff'));

-- RLS: Staff can update contacts
CREATE POLICY "Business staff can update contacts"
ON public.crm_contacts FOR UPDATE
USING (public.is_biz_member(business_id, auth.uid(), 'staff'));

-- RLS: Admins can delete contacts
CREATE POLICY "Business admins can delete contacts"
ON public.crm_contacts FOR DELETE
USING (public.is_biz_member(business_id, auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_crm_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_contacts_updated_at_trigger
BEFORE UPDATE ON public.crm_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_crm_contacts_updated_at();

-- CRM Activities table for metrics
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'sale')),
  description text,
  value numeric(10,2), -- for sales tracking
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

CREATE INDEX idx_crm_activities_business ON public.crm_activities(business_id, created_at);
CREATE INDEX idx_crm_activities_contact ON public.crm_activities(contact_id);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members can view activities"
ON public.crm_activities FOR SELECT
USING (public.is_biz_member(business_id, auth.uid(), 'viewer'));

CREATE POLICY "Business staff can insert activities"
ON public.crm_activities FOR INSERT
WITH CHECK (public.is_biz_member(business_id, auth.uid(), 'staff') AND created_by = auth.uid());

-- Stripe KYC status check (stub)
CREATE OR REPLACE FUNCTION public.needs_kyc(_business_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Stub: Check if business has Stripe account set up
  -- In production, query custom_fields->>'stripe_verified' on businesses
  RETURN NOT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = _business_id
    AND (custom_fields->>'stripe_verified')::boolean = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.needs_kyc TO authenticated;

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_activities;