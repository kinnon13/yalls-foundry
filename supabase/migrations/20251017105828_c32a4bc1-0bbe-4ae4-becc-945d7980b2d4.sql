-- ========== PR4.1 Hardening: Indexes + Retention ==========

-- 1) Error-focused partial index for "what's broken" queries
CREATE INDEX IF NOT EXISTS idx_rpc_obs_tenant_err_time
  ON public.rpc_observations(tenant_id, created_at DESC)
  WHERE status = 'error';

-- 2) Optional index for drilling by RPC name
CREATE INDEX IF NOT EXISTS idx_rpc_obs_name_time
  ON public.rpc_observations(rpc_name, created_at DESC);

-- 3) Admin SELECT policy (admins can view raw observations)
CREATE POLICY rpc_obs_admin_select
  ON public.rpc_observations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin'::app_role, 'admin'::app_role)
    )
  );

-- 4) Enable pg_cron extension for retention
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 5) Schedule 30-day retention cleanup (daily at 3:17 AM)
SELECT cron.schedule(
  'rpc_obs_retention_daily',
  '17 3 * * *',
  $$ DELETE FROM public.rpc_observations WHERE created_at < now() - interval '30 days' $$
);