-- Final RLS + Admin Override RPCs + Observability

-- Audit trail for entitlement overrides
CREATE TABLE IF NOT EXISTS public.entitlement_override_audit(
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID NOT NULL,
  target_user_id UUID,
  feature_id TEXT NOT NULL,
  allow BOOLEAN,
  reason TEXT,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ent_override_audit_target_time
  ON public.entitlement_override_audit(target_user_id, created_at DESC);

-- Add foreign key constraints for data integrity
ALTER TABLE public.plan_entitlements
  DROP CONSTRAINT IF EXISTS plan_entitlements_fk_plan,
  DROP CONSTRAINT IF EXISTS plan_entitlements_fk_feature,
  ADD CONSTRAINT plan_entitlements_fk_plan
    FOREIGN KEY (plan_id) REFERENCES public.billing_plans(id) ON DELETE CASCADE,
  ADD CONSTRAINT plan_entitlements_fk_feature
    FOREIGN KEY (feature_id) REFERENCES public.feature_catalog(id) ON DELETE CASCADE;

ALTER TABLE public.entitlement_overrides
  DROP CONSTRAINT IF EXISTS entitlement_overrides_fk_feature,
  ADD CONSTRAINT entitlement_overrides_fk_feature
    FOREIGN KEY (feature_id) REFERENCES public.feature_catalog(id) ON DELETE CASCADE;

-- Unique indexes to prevent duplicate overrides
CREATE UNIQUE INDEX IF NOT EXISTS ux_ent_overrides_user_feature
  ON public.entitlement_overrides(user_id, feature_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_ent_overrides_global_feature
  ON public.entitlement_overrides(feature_id)
  WHERE user_id IS NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_subs_active
  ON public.user_subscriptions(user_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_plan_entitlements_plan_feature
  ON public.plan_entitlements(plan_id, feature_id);

-- Admin override upsert (with audit + observability)
CREATE OR REPLACE FUNCTION public.admin_set_entitlement_override(
  p_target_user_id UUID,
  p_feature_id TEXT,
  p_allow BOOLEAN,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_is_admin BOOLEAN;
BEGIN
  -- Admin check
  v_is_admin := has_role(v_actor, 'admin'::app_role);
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Feature must exist
  IF NOT EXISTS (SELECT 1 FROM feature_catalog WHERE id = p_feature_id) THEN
    RAISE EXCEPTION 'unknown_feature %', p_feature_id;
  END IF;

  -- Upsert override
  IF p_target_user_id IS NOT NULL THEN
    INSERT INTO entitlement_overrides(user_id, feature_id, allow)
    VALUES (p_target_user_id, p_feature_id, p_allow)
    ON CONFLICT (user_id, feature_id)
    WHERE user_id IS NOT NULL
    DO UPDATE SET allow = EXCLUDED.allow, created_at = now();
  ELSE
    -- Global override (null user)
    INSERT INTO entitlement_overrides(user_id, feature_id, allow)
    VALUES (NULL, p_feature_id, p_allow)
    ON CONFLICT (feature_id)
    WHERE user_id IS NULL
    DO UPDATE SET allow = EXCLUDED.allow, created_at = now();
  END IF;

  -- Audit
  INSERT INTO entitlement_override_audit(actor_user_id, target_user_id, feature_id, allow, reason, action)
  VALUES (v_actor, p_target_user_id, p_feature_id, p_allow, p_reason, 'upsert');

  -- Telemetry (non-blocking)
  BEGIN
    INSERT INTO ai_action_ledger(user_id, agent, action, input, output, result)
    VALUES (
      v_actor,
      'admin',
      'entitlement_override_set',
      jsonb_build_object('feature', p_feature_id, 'target', p_target_user_id, 'allow', p_allow),
      jsonb_build_object('reason', p_reason),
      'success'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Silent failure for telemetry
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_entitlement_override(UUID, TEXT, BOOLEAN, TEXT) TO authenticated;

-- Admin override clear
CREATE OR REPLACE FUNCTION public.admin_clear_entitlement_override(
  p_target_user_id UUID,
  p_feature_id TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_deleted INT := 0;
BEGIN
  v_is_admin := has_role(v_actor, 'admin'::app_role);
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  DELETE FROM entitlement_overrides
  WHERE ((user_id IS NULL AND p_target_user_id IS NULL) OR user_id = p_target_user_id)
    AND feature_id = p_feature_id;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Audit
  INSERT INTO entitlement_override_audit(actor_user_id, target_user_id, feature_id, action)
  VALUES (v_actor, p_target_user_id, p_feature_id, 'delete');

  -- Telemetry
  BEGIN
    INSERT INTO ai_action_ledger(user_id, agent, action, input, output, result)
    VALUES (
      v_actor,
      'admin',
      'entitlement_override_clear',
      jsonb_build_object('feature', p_feature_id, 'target', p_target_user_id),
      jsonb_build_object('deleted', v_deleted),
      CASE WHEN v_deleted > 0 THEN 'success' ELSE 'noop' END
    );
  EXCEPTION WHEN OTHERS THEN
    -- Silent failure
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_clear_entitlement_override(UUID, TEXT) TO authenticated;

-- Observability: gate metrics for dashboards
CREATE OR REPLACE FUNCTION public.entitlement_gate_metrics(p_window_minutes INT DEFAULT 60)
RETURNS TABLE(
  outcome TEXT,
  feature TEXT,
  calls BIGINT,
  rate_pct NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH scoped AS (
    SELECT 
      (input->>'feature') AS feature,
      (output->>'outcome') AS outcome
    FROM ai_action_ledger
    WHERE action = 'entitlement_gate'
      AND created_at >= now() - make_interval(mins => p_window_minutes)
  )
  SELECT 
    outcome, 
    feature, 
    COUNT(*)::BIGINT AS calls,
    ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) AS rate_pct
  FROM scoped
  WHERE outcome IS NOT NULL AND feature IS NOT NULL
  GROUP BY outcome, feature
  ORDER BY calls DESC;
$$;

GRANT EXECUTE ON FUNCTION public.entitlement_gate_metrics(INT) TO authenticated;