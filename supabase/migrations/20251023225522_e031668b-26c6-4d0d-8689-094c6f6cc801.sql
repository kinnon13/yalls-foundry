-- Super Andy Mission Control Tables
-- These tables give Andy his memory and task management capabilities

-- Mission Tasks: Andy's to-do list and work tracker
CREATE TABLE IF NOT EXISTS public.mission_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  context TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Mission Memory: Andy's persistent knowledge store
CREATE TABLE IF NOT EXISTS public.mission_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Mission Logs: Andy's audit trail
CREATE TABLE IF NOT EXISTS public.mission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'critical')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  task_id UUID REFERENCES public.mission_tasks(id)
);

-- Enable Row Level Security
ALTER TABLE public.mission_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only service role (Andy) can access these tables
CREATE POLICY "Service role only - mission_tasks"
  ON public.mission_tasks
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role only - mission_memory"
  ON public.mission_memory
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role only - mission_logs"
  ON public.mission_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mission_tasks_status ON public.mission_tasks(status);
CREATE INDEX IF NOT EXISTS idx_mission_tasks_priority ON public.mission_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_mission_memory_key ON public.mission_memory(key);
CREATE INDEX IF NOT EXISTS idx_mission_memory_category ON public.mission_memory(category);
CREATE INDEX IF NOT EXISTS idx_mission_logs_timestamp ON public.mission_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mission_logs_level ON public.mission_logs(level);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_mission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mission_tasks_updated_at
  BEFORE UPDATE ON public.mission_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mission_updated_at();

CREATE TRIGGER update_mission_memory_updated_at
  BEFORE UPDATE ON public.mission_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mission_updated_at();

-- Helper function to clean up expired memory
CREATE OR REPLACE FUNCTION public.cleanup_expired_memory()
RETURNS void AS $$
BEGIN
  DELETE FROM public.mission_memory
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial bootstrap tasks for Andy
INSERT INTO public.mission_tasks (title, context, priority, notes) VALUES
  ('Initialize Mission Control System', 'First boot - verify all layers operational', 'critical', 'Run master-elon-scan.ts'),
  ('Daily Health Check', 'Ping all edge functions and verify responses', 'high', 'Run scripts/health/ping-functions.ts'),
  ('Weekly Architecture Audit', 'Deep scan for duplicates, dead code, and orphans', 'medium', 'Run complete scan suite')
ON CONFLICT DO NOTHING;