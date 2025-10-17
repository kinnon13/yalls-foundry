-- PR3.1: Search improvements + notification hardening (simplified)

-- Add tsvector column for full-text search on posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS body_tsv tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(body,''))) STORED;

CREATE INDEX IF NOT EXISTS idx_posts_body_tsv ON posts USING GIN(body_tsv);

-- Server-side view for notification lanes
CREATE OR REPLACE VIEW notif_center_view AS
SELECT 
  nr.id as receipt_id,
  n.id as notif_id,
  n.category,
  n.priority,
  n.title,
  n.body,
  n.link,
  n.payload,
  n.created_at,
  nr.user_id,
  nr.seen_at,
  nr.read_at,
  nr.muted,
  nr.archived
FROM notification_receipts nr
JOIN notifications n ON n.id = nr.notif_id
WHERE nr.archived = false
ORDER BY n.created_at DESC;

-- Update notif_send to enforce quiet hours and caps
CREATE OR REPLACE FUNCTION public.notif_send(
  p_user_id uuid,
  p_category text,
  p_title text,
  p_body text,
  p_link text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notif_id uuid;
  v_consent ai_consent%rowtype;
  v_hour int;
  v_sent_today int;
BEGIN
  -- Check consent settings
  SELECT * INTO v_consent FROM ai_consent WHERE user_id = p_user_id;
  
  -- Default if no consent record
  IF NOT FOUND THEN
    v_consent.proactive_enabled := true;
    v_consent.quiet_hours := NULL;
    v_consent.frequency_cap := 5;
  END IF;
  
  -- Check quiet hours
  v_hour := extract(hour from now());
  IF v_consent.quiet_hours IS NOT NULL THEN
    IF v_hour >= lower(v_consent.quiet_hours) AND v_hour < upper(v_consent.quiet_hours) THEN
      -- In quiet hours, skip notification
      RETURN NULL;
    END IF;
  END IF;
  
  -- Check frequency cap
  SELECT count(*) INTO v_sent_today
  FROM notification_receipts nr
  JOIN notifications n ON n.id = nr.notif_id
  WHERE nr.user_id = p_user_id
    AND n.created_at::date = current_date;
    
  IF v_sent_today >= v_consent.frequency_cap THEN
    -- At cap, skip notification
    RETURN NULL;
  END IF;
  
  -- Create notification (cast text to enum at insert time)
  INSERT INTO notifications (category, title, body, link, payload)
  VALUES (p_category::notification_category, p_title, p_body, p_link, p_payload)
  RETURNING id INTO v_notif_id;
  
  -- Create receipt
  INSERT INTO notification_receipts (notif_id, user_id)
  VALUES (v_notif_id, p_user_id);
  
  RETURN v_notif_id;
END;
$$;