-- Admin Vault tables for encrypted storage

-- Vaults
CREATE TABLE IF NOT EXISTS public.vaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vaults_owner_entity 
ON public.vaults(owner_id, COALESCE(entity_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Vault items (encrypted)
CREATE TABLE IF NOT EXISTS public.vault_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('password', 'note', 'api_key', 'doc')),
  enc_blob bytea NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Vault access control
CREATE TABLE IF NOT EXISTS public.vault_access (
  vault_id uuid NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'viewer')),
  mfa_required boolean NOT NULL DEFAULT true,
  PRIMARY KEY (vault_id, user_id)
);

-- Enable RLS
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vaults
DROP POLICY IF EXISTS "Vault owners and members can view vaults" ON public.vaults;
CREATE POLICY "Vault owners and members can view vaults"
ON public.vaults FOR SELECT
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.vault_access a
    WHERE a.vault_id = id AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can create vaults" ON public.vaults;
CREATE POLICY "Owners can create vaults"
ON public.vaults FOR INSERT
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update their vaults" ON public.vaults;
CREATE POLICY "Owners can update their vaults"
ON public.vaults FOR UPDATE
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their vaults" ON public.vaults;
CREATE POLICY "Owners can delete their vaults"
ON public.vaults FOR DELETE
USING (owner_id = auth.uid());

-- RLS Policies for vault_items
DROP POLICY IF EXISTS "Vault members can view items" ON public.vault_items;
CREATE POLICY "Vault members can view items"
ON public.vault_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vaults v
    WHERE v.id = vault_id
    AND (
      v.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.vault_access a
        WHERE a.vault_id = v.id AND a.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Vault owners and admins can insert items" ON public.vault_items;
CREATE POLICY "Vault owners and admins can insert items"
ON public.vault_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vaults v
    LEFT JOIN public.vault_access a ON a.vault_id = v.id AND a.user_id = auth.uid()
    WHERE v.id = vault_id
    AND (v.owner_id = auth.uid() OR a.role IN ('owner', 'admin'))
  )
);

DROP POLICY IF EXISTS "Vault owners and admins can delete items" ON public.vault_items;
CREATE POLICY "Vault owners and admins can delete items"
ON public.vault_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.vaults v
    LEFT JOIN public.vault_access a ON a.vault_id = v.id AND a.user_id = auth.uid()
    WHERE v.id = vault_id
    AND (v.owner_id = auth.uid() OR a.role IN ('owner', 'admin'))
  )
);

-- RLS Policies for vault_access
DROP POLICY IF EXISTS "Vault owners can manage access" ON public.vault_access;
CREATE POLICY "Vault owners can manage access"
ON public.vault_access FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.vaults v
    WHERE v.id = vault_id AND v.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vaults v
    WHERE v.id = vault_id AND v.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can view their access" ON public.vault_access;
CREATE POLICY "Members can view their access"
ON public.vault_access FOR SELECT
USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vaults_owner ON public.vaults(owner_id);
CREATE INDEX IF NOT EXISTS idx_vaults_entity ON public.vaults(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vault_items_vault ON public.vault_items(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_access_vault ON public.vault_access(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_access_user ON public.vault_access(user_id);