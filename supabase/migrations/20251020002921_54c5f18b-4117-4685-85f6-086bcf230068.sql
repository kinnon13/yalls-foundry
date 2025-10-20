-- Create rocker_outbox table for queuing outbound messages
CREATE TABLE IF NOT EXISTS public.rocker_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'chat', 'push', 'voice', 'whatsapp')),
  to_addr TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_rocker_outbox_status_scheduled ON public.rocker_outbox(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_rocker_outbox_user_id ON public.rocker_outbox(user_id);

-- Enable RLS
ALTER TABLE public.rocker_outbox ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own outbox"
  ON public.rocker_outbox FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage outbox"
  ON public.rocker_outbox FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER set_rocker_outbox_updated_at
  BEFORE UPDATE ON public.rocker_outbox
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();