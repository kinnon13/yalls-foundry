-- AI Tools Registry
-- Dynamic tool loading with OpenAPI support

CREATE TABLE IF NOT EXISTS public.ai_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('user', 'admin', 'super')),
  name text NOT NULL,
  version text NOT NULL DEFAULT '1',
  kind text NOT NULL CHECK (kind IN ('native', 'openapi', 'webhook')),
  spec jsonb NOT NULL,
  allow_domains text[] DEFAULT '{}',
  rate_limit_per_min int DEFAULT 60,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role, name, version)
);

CREATE INDEX IF NOT EXISTS ai_tools_role_name_idx ON public.ai_tools(role, name);
CREATE INDEX IF NOT EXISTS ai_tools_enabled_idx ON public.ai_tools(enabled) WHERE enabled = true;

-- Budget Policies
-- Per-tenant cost management

CREATE TABLE IF NOT EXISTS public.ai_budget_policies (
  tenant_id uuid PRIMARY KEY,
  daily_cents_limit int NOT NULL DEFAULT 500,
  hard_block boolean NOT NULL DEFAULT true,
  alert_threshold_pct int DEFAULT 80 CHECK (alert_threshold_pct BETWEEN 0 AND 100),
  updated_at timestamptz DEFAULT now()
);

-- Tool Usage Tracking
-- Rate limiting and analytics

CREATE TABLE IF NOT EXISTS public.ai_tool_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  tenant_id uuid,
  invoked_at timestamptz DEFAULT now(),
  duration_ms int,
  success boolean,
  error_message text,
  cost_cents numeric(10,4) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ai_tool_usage_tenant_time_idx ON public.ai_tool_usage(tenant_id, invoked_at DESC);
CREATE INDEX IF NOT EXISTS ai_tool_usage_tool_time_idx ON public.ai_tool_usage(tool_id, invoked_at DESC);

-- RLS Policies for tools (super admin only)
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_budget_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_tools_super_read ON public.ai_tools
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
  );

CREATE POLICY ai_tools_super_write ON public.ai_tools
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
  );

CREATE POLICY ai_budget_super_read ON public.ai_budget_policies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
  );

CREATE POLICY ai_budget_super_write ON public.ai_budget_policies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
  );

-- Usage visible to super admins and own tenant
CREATE POLICY ai_tool_usage_read ON public.ai_tool_usage
  FOR SELECT USING (
    tenant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
  );

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.check_tool_rate_limit(
  p_tool_id uuid,
  p_tenant_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*) < (
    SELECT rate_limit_per_min 
    FROM public.ai_tools 
    WHERE id = p_tool_id
  )
  FROM public.ai_tool_usage
  WHERE tool_id = p_tool_id
    AND tenant_id = p_tenant_id
    AND invoked_at > now() - interval '1 minute';
$$;

GRANT EXECUTE ON FUNCTION public.check_tool_rate_limit TO service_role;