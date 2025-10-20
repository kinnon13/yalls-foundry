-- Update Rocker flags for full activation
INSERT INTO public.runtime_flags (key, value, description) VALUES
  ('rocker.memory.long_term', '{"enabled":true,"retention_days":null}'::jsonb, 'Permanent long-term memory'),
  ('rocker.memory.super_admin_priority', '{"enabled":true,"priority":"super_admin"}'::jsonb, 'Prioritize super admin answers'),
  ('rocker.vault.uploads', '{"enabled":true,"max_size_mb":50}'::jsonb, 'Allow file uploads to vault'),
  ('rocker.evidence_cards', '{"enabled":true,"always_show":true}'::jsonb, 'Show evidence for all actions'),
  ('rocker.daily_kickoff', '{"enabled":true,"time":"09:00","timezone":"America/Denver"}'::jsonb, 'Daily kickoff schedule')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();

-- Ensure super admin memory table has proper indexes
CREATE INDEX IF NOT EXISTS idx_admin_memory_user ON public.ai_admin_private_memory(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_memory_key ON public.ai_admin_private_memory(key);
CREATE INDEX IF NOT EXISTS idx_admin_memory_tags ON public.ai_admin_private_memory USING gin(tags);

-- Create vault documents table for uploaded files
CREATE TABLE IF NOT EXISTS public.rocker_vault_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  content_type text,
  size_bytes int,
  storage_path text NOT NULL,
  processed boolean DEFAULT false,
  chunks_count int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  project text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_docs_user ON public.rocker_vault_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_docs_project ON public.rocker_vault_documents(project);
CREATE INDEX IF NOT EXISTS idx_vault_docs_status ON public.rocker_vault_documents(status);

-- RLS for vault documents
ALTER TABLE public.rocker_vault_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vault docs"
  ON public.rocker_vault_documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create evidence cards table
CREATE TABLE IF NOT EXISTS public.rocker_evidence_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id uuid REFERENCES public.ai_action_ledger(id),
  title text NOT NULL,
  inputs jsonb DEFAULT '{}'::jsonb,
  steps jsonb DEFAULT '[]'::jsonb,
  outputs jsonb DEFAULT '{}'::jsonb,
  uncertainties text[],
  vault_changes jsonb,
  undo_available boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_user ON public.rocker_evidence_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_action ON public.rocker_evidence_cards(action_id);

ALTER TABLE public.rocker_evidence_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own evidence"
  ON public.rocker_evidence_cards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create daily kickoff schedule table
CREATE TABLE IF NOT EXISTS public.rocker_daily_kickoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_time time NOT NULL DEFAULT '09:00',
  timezone text DEFAULT 'America/Denver',
  enabled boolean DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kickoff_user ON public.rocker_daily_kickoffs(user_id);

ALTER TABLE public.rocker_daily_kickoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own kickoffs"
  ON public.rocker_daily_kickoffs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);