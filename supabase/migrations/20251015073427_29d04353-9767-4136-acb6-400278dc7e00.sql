-- Create rocker notifications table for voice reminders
CREATE TABLE IF NOT EXISTS public.rocker_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rocker_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.rocker_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.rocker_notifications
FOR INSERT
WITH CHECK (true);

-- Users can mark their notifications as read
CREATE POLICY "Users can update own notifications"
ON public.rocker_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rocker_notifications;