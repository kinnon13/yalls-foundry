-- Event Producer RPCs for QR check-in + CSV export
CREATE OR REPLACE FUNCTION public.reservation_issue_qr(p_res_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_qr text;
BEGIN
  UPDATE reservations
  SET qr_code = COALESCE(qr_code, encode(gen_random_bytes(16),'hex'))
  WHERE id = p_res_id
  RETURNING qr_code INTO v_qr;

  RETURN v_qr;
END $$;

-- Check in by QR
CREATE OR REPLACE FUNCTION public.reservation_check_in(p_qr text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_ok boolean := false;
BEGIN
  UPDATE reservations
  SET status='checked_in', metadata = jsonb_set(metadata,'{checked_in_at}', to_jsonb(now()))
  WHERE qr_code = p_qr AND status IN ('active')
  RETURNING true INTO v_ok;

  RETURN COALESCE(v_ok, false);
END $$;

-- Export reservations CSV by event
CREATE OR REPLACE FUNCTION public.reservations_export_csv(p_event_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_csv text;
BEGIN
  SELECT string_agg(row_to_json(r)::text, E'\n') INTO v_csv
  FROM (
    SELECT id, user_id, kind, qty, amount_cents, status, qr_code, created_at
    FROM reservations WHERE event_id=p_event_id
    ORDER BY created_at DESC, id DESC
  ) r;
  RETURN v_csv;
END $$;

-- Feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  rollout int NOT NULL DEFAULT 100,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flags read" ON feature_flags FOR SELECT USING (true);