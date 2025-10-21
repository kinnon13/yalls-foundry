-- Voice events logging table for TTS/STT debugging and analytics
CREATE TABLE IF NOT EXISTS public.voice_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient querying by user and role
CREATE INDEX IF NOT EXISTS idx_voice_events_user_id ON public.voice_events(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_events_actor_role ON public.voice_events(actor_role);
CREATE INDEX IF NOT EXISTS idx_voice_events_created_at ON public.voice_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.voice_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own voice events
CREATE POLICY "Users can insert own voice events"
  ON public.voice_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own voice events
CREATE POLICY "Users can read own voice events"
  ON public.voice_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Super admins can read all voice events
CREATE POLICY "Super admins can read all voice events"
  ON public.voice_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Drop old role check constraint if exists
ALTER TABLE public.rocker_messages DROP CONSTRAINT IF EXISTS rocker_messages_role_check;

-- Add new constraint allowing canonical role keys
ALTER TABLE public.rocker_messages 
ADD CONSTRAINT rocker_messages_role_check 
CHECK (role IN ('user', 'assistant', 'user_rocker', 'admin_rocker', 'super_andy'));

-- Migrate rocker_messages role values to canonical role keys
UPDATE public.rocker_messages
SET role = CASE role
  WHEN 'admin' THEN 'admin_rocker'
  WHEN 'super' THEN 'super_andy'
  WHEN 'super_rocker' THEN 'super_andy'
  WHEN 'knower' THEN 'super_andy'
  ELSE role
END
WHERE role IN ('admin', 'super', 'super_rocker', 'knower');