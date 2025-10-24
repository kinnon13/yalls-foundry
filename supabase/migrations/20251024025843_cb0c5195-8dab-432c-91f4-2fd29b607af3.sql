-- Andy Notebook & Real-time Tasks for Super Andy
-- Tables for Andy to write reports/notes and track tasks with follow-ups

-- Andy's notes/reports table
CREATE TABLE IF NOT EXISTS public.andy_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'report' CHECK (note_type IN ('report', 'finding', 'suggestion', 'analysis')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_andy_notes_user_topic ON public.andy_notes(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_andy_notes_status ON public.andy_notes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_andy_notes_created ON public.andy_notes(user_id, created_at DESC);

-- RLS policies
ALTER TABLE public.andy_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
  ON public.andy_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
  ON public.andy_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.andy_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.andy_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for andy_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.andy_notes;

-- Update trigger for andy_notes
CREATE OR REPLACE FUNCTION public.update_andy_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_andy_notes_timestamp
  BEFORE UPDATE ON public.andy_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_andy_notes_updated_at();

-- Task follow-ups table (links notes to tasks)
CREATE TABLE IF NOT EXISTS public.andy_task_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.andy_notes(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.rocker_tasks_v2(id) ON DELETE CASCADE,
  due_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_followups_user_due ON public.andy_task_followups(user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_followups_note ON public.andy_task_followups(note_id);

ALTER TABLE public.andy_task_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own followups"
  ON public.andy_task_followups FOR ALL
  USING (auth.uid() = user_id);

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.rocker_tasks_v2;

COMMENT ON TABLE public.andy_notes IS 'Andy Notebook - reports, findings, and suggestions with follow-up tracking';
COMMENT ON TABLE public.andy_task_followups IS 'Links Andy notes to tasks for proactive follow-ups and reminders';