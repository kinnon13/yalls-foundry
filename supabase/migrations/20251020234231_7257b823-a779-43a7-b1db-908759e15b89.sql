-- Encrypted API Key Vault
CREATE TABLE IF NOT EXISTS public.provider_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider <> ''),
  name text NOT NULL DEFAULT 'default' CHECK (name <> ''),
  encrypted_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE(user_id, provider, name)
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END; 
$$;

CREATE TRIGGER provider_secrets_updated
  BEFORE UPDATE ON public.provider_secrets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enable RLS
ALTER TABLE public.provider_secrets ENABLE ROW LEVEL SECURITY;

-- Users can only see their own keys (metadata only, never raw keys)
CREATE POLICY provider_secrets_select ON public.provider_secrets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY provider_secrets_insert ON public.provider_secrets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY provider_secrets_update ON public.provider_secrets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY provider_secrets_delete ON public.provider_secrets
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_provider_secrets_user_provider ON public.provider_secrets(user_id, provider, name);