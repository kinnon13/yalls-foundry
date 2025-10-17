-- P0.4: Linked Accounts with Verification
-- Social account linking, verification proofs, and badge system

CREATE TABLE public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('twitter', 'instagram', 'facebook', 'youtube', 'tiktok', 'linkedin', 'website', 'custom')),
  handle TEXT NOT NULL,
  display_name TEXT,
  profile_url TEXT,
  verified BOOLEAN DEFAULT false,
  verification_method TEXT CHECK (verification_method IN ('oauth', 'dns', 'meta_tag', 'file', 'manual', 'admin')),
  proof_url TEXT,
  proof_data JSONB DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, handle)
);

-- Indexes
CREATE INDEX idx_linked_accounts_user ON public.linked_accounts(user_id, created_at DESC);
CREATE INDEX idx_linked_accounts_provider ON public.linked_accounts(provider, verified);
CREATE INDEX idx_linked_accounts_handle ON public.linked_accounts(provider, lower(handle));

-- Enable RLS
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own linked accounts"
  ON public.linked_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view verified accounts on profiles"
  ON public.linked_accounts FOR SELECT
  USING (verified = true);

CREATE POLICY "Users can manage their own linked accounts"
  ON public.linked_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own linked accounts"
  ON public.linked_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own linked accounts"
  ON public.linked_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can verify accounts"
  ON public.linked_accounts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger
CREATE TRIGGER update_linked_accounts_updated_at
  BEFORE UPDATE ON public.linked_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RPC: Add/update linked account
CREATE OR REPLACE FUNCTION public.linked_account_upsert(
  p_provider TEXT,
  p_handle TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_profile_url TEXT DEFAULT NULL,
  p_proof_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Check if account already exists
  SELECT id, true INTO v_account_id, v_exists
  FROM public.linked_accounts
  WHERE user_id = auth.uid()
    AND provider = p_provider
    AND lower(handle) = lower(p_handle);

  IF v_exists THEN
    -- Update existing
    UPDATE public.linked_accounts SET
      display_name = COALESCE(p_display_name, display_name),
      profile_url = COALESCE(p_profile_url, profile_url),
      proof_url = COALESCE(p_proof_url, proof_url),
      metadata = metadata || p_metadata,
      updated_at = now()
    WHERE id = v_account_id;
  ELSE
    -- Insert new
    INSERT INTO public.linked_accounts (
      user_id,
      provider,
      handle,
      display_name,
      profile_url,
      proof_url,
      metadata
    ) VALUES (
      auth.uid(),
      p_provider,
      p_handle,
      p_display_name,
      p_profile_url,
      p_proof_url,
      p_metadata
    ) RETURNING id INTO v_account_id;
  END IF;

  -- Log action
  INSERT INTO public.ai_action_ledger (user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'linked_account_upsert',
    jsonb_build_object('provider', p_provider, 'handle', p_handle),
    jsonb_build_object('account_id', v_account_id, 'is_new', NOT v_exists),
    'success'
  );

  RETURN v_account_id;
END;
$$;

-- RPC: Verify linked account (admin only)
CREATE OR REPLACE FUNCTION public.linked_account_verify(
  p_account_id UUID,
  p_verification_method TEXT,
  p_proof_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin permission
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Update verification status
  UPDATE public.linked_accounts SET
    verified = true,
    verification_method = p_verification_method,
    proof_data = p_proof_data,
    verified_at = now(),
    verified_by = auth.uid(),
    updated_at = now()
  WHERE id = p_account_id;

  -- Log admin action
  INSERT INTO public.admin_audit_log (action, actor_user_id, metadata)
  VALUES (
    'verify_linked_account',
    auth.uid(),
    jsonb_build_object('account_id', p_account_id, 'method', p_verification_method)
  );

  RETURN jsonb_build_object(
    'success', true,
    'verified_at', now()
  );
END;
$$;

-- Profile badges table (achievements, verified status, etc.)
CREATE TABLE public.profile_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('verified', 'producer', 'sponsor', 'contributor', 'early_adopter', 'top_seller', 'achievement')),
  badge_id TEXT NOT NULL, -- Specific badge identifier
  display_name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  visible BOOLEAN DEFAULT true,
  display_order INT DEFAULT 999,
  UNIQUE(user_id, badge_type, badge_id)
);

CREATE INDEX idx_profile_badges_user ON public.profile_badges(user_id, visible, display_order);

ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
  ON public.profile_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view visible badges"
  ON public.profile_badges FOR SELECT
  USING (visible = true);

CREATE POLICY "System can grant badges"
  ON public.profile_badges FOR INSERT
  WITH CHECK (true);

-- RPC: Grant badge
CREATE OR REPLACE FUNCTION public.badge_grant(
  p_user_id UUID,
  p_badge_type TEXT,
  p_badge_id TEXT,
  p_display_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge_id UUID;
BEGIN
  INSERT INTO public.profile_badges (
    user_id,
    badge_type,
    badge_id,
    display_name,
    description,
    metadata
  ) VALUES (
    p_user_id,
    p_badge_type,
    p_badge_id,
    p_display_name,
    p_description,
    p_metadata
  )
  ON CONFLICT (user_id, badge_type, badge_id) DO UPDATE SET
    metadata = profile_badges.metadata || p_metadata,
    earned_at = now()
  RETURNING id INTO v_badge_id;

  RETURN v_badge_id;
END;
$$;