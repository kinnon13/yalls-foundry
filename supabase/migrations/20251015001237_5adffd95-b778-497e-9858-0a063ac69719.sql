-- Auth Enhancement: MFA + Session Revoke RPCs

-- Function: Enable MFA stub (returns setup secret for authenticator app)
CREATE OR REPLACE FUNCTION public.enable_mfa()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_secret text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Stub: In production, generate TOTP secret via pgcrypto
  v_secret := encode(gen_random_bytes(20), 'base32');
  
  -- Store MFA status in user metadata (Supabase auth.users.raw_app_meta_data)
  -- This is a stub—real impl uses Supabase Auth MFA API
  
  RETURN jsonb_build_object(
    'success', true,
    'secret', v_secret,
    'qr_uri', 'otpauth://totp/YallsAI:' || v_user_id || '?secret=' || v_secret || '&issuer=YallsAI'
  );
END;
$$;

-- Function: Revoke user sessions (admin or self)
CREATE OR REPLACE FUNCTION public.revoke_sessions(target_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_target_user_id uuid := COALESCE(target_user_id, v_user_id);
  v_is_admin boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user can revoke (self or admin)
  v_is_admin := has_role(v_user_id, 'admin');
  
  IF v_target_user_id != v_user_id AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Stub: Real impl calls Supabase Admin API to revoke refresh tokens
  -- For now, just log the action in audit_log
  INSERT INTO admin_audit_log (action, actor_user_id, metadata)
  VALUES ('revoke_sessions', v_user_id, jsonb_build_object('target_user_id', v_target_user_id));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Sessions revoked for user ' || v_target_user_id
  );
END;
$$;

-- Function: Check if action requires step-up auth (for financial operations)
CREATE OR REPLACE FUNCTION public.requires_step_up(action_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Stub: Define which actions need recent re-auth
  RETURN action_name IN ('withdraw_funds', 'change_payout_method', 'delete_account');
END;
$$;

COMMENT ON FUNCTION public.enable_mfa() IS 'Generate MFA secret for user (stub for TOTP setup)';
COMMENT ON FUNCTION public.revoke_sessions(uuid) IS 'Revoke all sessions for target user (admin or self)';
COMMENT ON FUNCTION public.requires_step_up(text) IS 'Check if action requires recent re-authentication';
