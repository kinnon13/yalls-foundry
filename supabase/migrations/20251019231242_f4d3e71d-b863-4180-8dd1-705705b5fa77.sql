-- Secure credentials vault (encrypted at rest)
CREATE TABLE IF NOT EXISTS public.user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  username text,
  encrypted_password text, -- Will be encrypted by edge function
  notes text,
  url text,
  tags text[] DEFAULT '{}',
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_name)
);

ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own credentials"
  ON public.user_credentials
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Web automation queue
CREATE TABLE IF NOT EXISTS public.web_automation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type text NOT NULL, -- 'scrape', 'monitor', 'navigate', 'extract'
  url text NOT NULL,
  config jsonb DEFAULT '{}',
  schedule_cron text, -- For recurring tasks
  status text NOT NULL DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed'
  result jsonb,
  error text,
  screenshots text[], -- Array of storage URLs
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.web_automation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own automation"
  ON public.web_automation_tasks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Autonomy settings per user
CREATE TABLE IF NOT EXISTS public.user_autonomy_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  autonomy_level text NOT NULL DEFAULT 'draft_only', -- 'draft_only', 'auto_with_review', 'full_auto'
  allow_domains text[] DEFAULT '{}',
  allow_email_send boolean DEFAULT false,
  allow_calendar_write boolean DEFAULT false,
  allow_file_write boolean DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_autonomy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own autonomy"
  ON public.user_autonomy_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Focus sessions (enhanced)
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  duration_minutes int NOT NULL,
  micro_steps jsonb DEFAULT '[]', -- Array of 3-7 min steps
  current_step int DEFAULT 0,
  status text NOT NULL DEFAULT 'planned', -- 'planned', 'active', 'paused', 'completed'
  started_at timestamptz,
  paused_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own focus sessions"
  ON public.focus_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily briefs
CREATE TABLE IF NOT EXISTS public.daily_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_date date NOT NULL,
  goals_progress jsonb DEFAULT '[]',
  schedule jsonb DEFAULT '[]',
  blockers jsonb DEFAULT '[]',
  high_leverage_moves jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, brief_date)
);

ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own briefs"
  ON public.daily_briefs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Command history (for learning user patterns)
CREATE TABLE IF NOT EXISTS public.rocker_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_command text NOT NULL,
  parsed_intent text,
  parameters jsonb,
  execution_result jsonb,
  success boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rocker_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own commands"
  ON public.rocker_commands
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Integrations table
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service text NOT NULL, -- 'google', 'microsoft', 'hubspot', etc
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[],
  config jsonb DEFAULT '{}',
  enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, service)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integrations"
  ON public.user_integrations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_credentials
  BEFORE UPDATE ON public.user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_autonomy
  BEFORE UPDATE ON public.user_autonomy_settings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_integrations
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();