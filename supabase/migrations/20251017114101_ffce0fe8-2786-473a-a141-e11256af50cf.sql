-- Additional RLS policies for catalog tables (read-only to authenticated)
ALTER TABLE public.feature_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY catalog_select ON public.feature_catalog
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY plans_select ON public.billing_plans
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY plan_ent_select ON public.plan_entitlements
  FOR SELECT TO authenticated
  USING (true);

-- Admin policies for managing subscriptions and overrides
CREATE POLICY sub_admin_all ON public.user_subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY over_admin_all ON public.entitlement_overrides
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin override RPC (for sales/support to grant access)
CREATE OR REPLACE FUNCTION public.entitlement_override_set(
  p_user_id uuid,
  p_feature_id text,
  p_allow boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Only admins can set overrides
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  INSERT INTO entitlement_overrides (user_id, feature_id, allow)
  VALUES (p_user_id, p_feature_id, p_allow)
  ON CONFLICT (user_id, feature_id) 
  DO UPDATE SET allow = EXCLUDED.allow, created_at = now()
  RETURNING id INTO v_id;

  -- Log to ledger
  PERFORM rocker_log_action(
    auth.uid(),
    'admin',
    'entitlement_override_set',
    jsonb_build_object('target_user_id', p_user_id, 'feature_id', p_feature_id, 'allow', p_allow),
    jsonb_build_object('override_id', v_id),
    'success',
    NULL
  );

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.entitlement_override_set(uuid, text, boolean) TO authenticated;

-- Add unique constraint for overrides
CREATE UNIQUE INDEX IF NOT EXISTS idx_ent_override_unique 
  ON public.entitlement_overrides(user_id, feature_id);