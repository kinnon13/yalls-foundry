-- ========================================
-- Identity Resolution: Add tenant_id + Identities Table
-- ========================================

-- 1) Add tenant_id to crm_contacts (defaults to auth.uid for compatibility)
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT auth.uid();

-- 2) Contact identities (email/phone/external_id)
CREATE TABLE IF NOT EXISTS public.contact_identities (
  tenant_id   uuid NOT NULL DEFAULT COALESCE(app.current_tenant_id(), auth.uid()),
  contact_id  uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('email','phone','external_id')),
  value       text NOT NULL,  -- store normalized (lowercased email, E.164 phone)
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, type, value)
);

-- Enable RLS
ALTER TABLE public.contact_identities ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
DROP POLICY IF EXISTS "Tenant isolation for contact_identities" ON public.contact_identities;
CREATE POLICY "Tenant isolation for contact_identities"
  ON public.contact_identities
  FOR ALL
  USING (tenant_id = COALESCE(app.current_tenant_id(), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(app.current_tenant_id(), auth.uid()));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_contact_identities_contact
  ON public.contact_identities(tenant_id, contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_identities_type_value
  ON public.contact_identities(tenant_id, type, value);

-- 3) Unique per-tenant email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_crm_contacts_tenant_email
  ON public.crm_contacts(tenant_id, lower(email))
  WHERE email IS NOT NULL;

COMMENT ON TABLE public.contact_identities IS 
  'Identity resolution: maps emails, phones, external IDs to canonical contacts';