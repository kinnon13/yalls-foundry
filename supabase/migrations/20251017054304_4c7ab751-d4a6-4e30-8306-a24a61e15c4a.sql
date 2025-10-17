-- PR B7: QR Check-in
CREATE TABLE IF NOT EXISTS public.entry_checkin_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_by UUID,
  method TEXT NOT NULL DEFAULT 'qr',
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_checkin_entry ON entry_checkin_log(entry_id);

ALTER TABLE public.entry_checkin_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Producers can log checkins" ON entry_checkin_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Producers can view checkins" ON entry_checkin_log FOR SELECT USING (true);

-- PR C2: Save/view RPCs
CREATE OR REPLACE FUNCTION public.save_item(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO saved_items (user_id, listing_id)
  VALUES (auth.uid(), p_listing_id)
  ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.unsave_item(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM saved_items
  WHERE user_id = auth.uid() AND listing_id = p_listing_id;
END $$;

CREATE OR REPLACE FUNCTION public.record_view(p_listing_id UUID, p_session_id TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO views_coldstart (listing_id, user_id, session_id)
  VALUES (p_listing_id, auth.uid(), p_session_id);
END $$;