-- Create emails_inbound table for receiving emails via SendGrid
CREATE TABLE IF NOT EXISTS public.emails_inbound (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msg_id text,
  from_addr text NOT NULL,
  to_addr text NOT NULL,
  subject text,
  text_body text,
  html_body text,
  attachments jsonb DEFAULT '[]'::jsonb,
  headers jsonb DEFAULT '{}'::jsonb,
  raw_payload jsonb,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  rocker_thread_id uuid,
  created_at timestamptz DEFAULT now(),
  tenant_id uuid
);

-- Enable RLS
ALTER TABLE public.emails_inbound ENABLE ROW LEVEL SECURITY;

-- Admins can view all inbound emails
CREATE POLICY "Admins can view all emails"
ON public.emails_inbound
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert (webhook)
CREATE POLICY "Service can insert emails"
ON public.emails_inbound
FOR INSERT
WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_emails_inbound_from ON public.emails_inbound(from_addr);
CREATE INDEX idx_emails_inbound_to ON public.emails_inbound(to_addr);
CREATE INDEX idx_emails_inbound_created ON public.emails_inbound(created_at DESC);
CREATE INDEX idx_emails_inbound_processed ON public.emails_inbound(processed) WHERE NOT processed;