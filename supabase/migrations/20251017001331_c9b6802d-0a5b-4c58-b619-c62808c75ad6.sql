-- Preview audit log table with immutability and admin-only access
CREATE TABLE IF NOT EXISTS public.preview_audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     text UNIQUE NOT NULL,
  user_id      uuid NOT NULL,
  source       text NOT NULL CHECK (source IN ('pay-preview','admin-preview','data-preview','app-preview','preview-security')),
  event_type   text NOT NULL,
  route        text,
  payload_hash text NOT NULL,
  user_agent   text,
  ip_inet      inet,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.preview_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin-only read policy
CREATE POLICY "admins can read audit"
  ON public.preview_audit_log FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Block all updates
CREATE POLICY "no updates"
  ON public.preview_audit_log FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- Block all deletes
CREATE POLICY "no deletes"
  ON public.preview_audit_log FOR DELETE
  USING (false);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_preview_audit_created_at ON public.preview_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_preview_audit_user ON public.preview_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_preview_audit_source_type ON public.preview_audit_log (source, event_type);