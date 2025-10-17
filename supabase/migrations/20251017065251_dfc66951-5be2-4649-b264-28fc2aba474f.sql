-- PR3: Finder + Notifications System

-- 1. Capability gaps table (for "Request a thing")
CREATE TABLE IF NOT EXISTS public.capability_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  section TEXT NOT NULL, -- 'social', 'marketplace', 'events', etc.
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.capability_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON public.capability_gaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests"
  ON public.capability_gaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.capability_gaps FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update requests"
  ON public.capability_gaps FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_capability_gaps_user ON public.capability_gaps(user_id, created_at DESC);
CREATE INDEX idx_capability_gaps_status ON public.capability_gaps(status, created_at DESC);

-- 2. Notifications system
CREATE TYPE notification_category AS ENUM ('social', 'orders', 'events', 'crm', 'ai', 'system');

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category notification_category NOT NULL,
  priority INT NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 3),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  thread_key TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notif_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  muted BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(notif_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lanes JSONB NOT NULL DEFAULT '{"all":true,"social":true,"orders":true,"events":true,"crm":true,"ai":true}'::jsonb,
  digest_hour INT CHECK (digest_hour BETWEEN 0 AND 23),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;

-- RLS: notifications readable if user has a receipt
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notification_receipts nr
      WHERE nr.notif_id = notifications.id AND nr.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their receipts"
  ON public.notification_receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their receipts"
  ON public.notification_receipts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create receipts"
  ON public.notification_receipts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can manage their prefs"
  ON public.notification_prefs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_notif_receipts_user ON public.notification_receipts(user_id, created_at DESC);
CREATE INDEX idx_notif_receipts_unread ON public.notification_receipts(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_category ON public.notifications(category, created_at DESC);

-- 3. RPCs for notifications
CREATE OR REPLACE FUNCTION public.notif_send(
  p_category notification_category,
  p_title TEXT,
  p_body TEXT,
  p_user_ids UUID[],
  p_link TEXT DEFAULT NULL,
  p_priority INT DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notif_id UUID;
  v_user_id UUID;
BEGIN
  -- Create notification
  INSERT INTO notifications (category, title, body, link, priority, created_by)
  VALUES (p_category, p_title, p_body, p_link, p_priority, auth.uid())
  RETURNING id INTO v_notif_id;

  -- Fan out to recipients
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    INSERT INTO notification_receipts (notif_id, user_id)
    VALUES (v_notif_id, v_user_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN v_notif_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notif_mark_read(p_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notification_receipts
  SET read_at = now()
  WHERE id = ANY(p_ids)
    AND user_id = auth.uid()
    AND read_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.notif_mark_all_read(p_lane TEXT DEFAULT 'all')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_lane = 'all' THEN
    UPDATE notification_receipts
    SET read_at = now()
    WHERE user_id = auth.uid() AND read_at IS NULL;
  ELSE
    UPDATE notification_receipts nr
    SET read_at = now()
    FROM notifications n
    WHERE nr.notif_id = n.id
      AND nr.user_id = auth.uid()
      AND nr.read_at IS NULL
      AND n.category = p_lane::notification_category;
  END IF;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER set_capability_gaps_updated_at
  BEFORE UPDATE ON capability_gaps
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_notification_prefs_updated_at
  BEFORE UPDATE ON notification_prefs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();