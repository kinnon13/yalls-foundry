-- Business Handle System
-- Add unique handle (business ID) to entities

-- Add handle column if not exists
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS handle text UNIQUE;

-- Add generated lowercase handle for case-insensitive lookups
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS handle_lower text GENERATED ALWAYS AS (lower(handle)) STORED;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_entities_handle_lower ON entities(handle_lower);

-- Handle reservations table (temporary holds during onboarding)
CREATE TABLE IF NOT EXISTS handle_reservations (
  handle text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE handle_reservations ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own reservations
CREATE POLICY "Users can view own handle reservations"
  ON handle_reservations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own handle reservations"
  ON handle_reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own handle reservations"
  ON handle_reservations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own handle reservations"
  ON handle_reservations FOR DELETE
  USING (auth.uid() = user_id);

-- Cleanup function for expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_handle_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM handle_reservations WHERE expires_at < now();
END;
$$;

-- RPC: Validate business handle
CREATE OR REPLACE FUNCTION validate_business_handle(p_handle text)
RETURNS TABLE(available boolean, normalized text, suggestions text[])
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_normalized text;
  v_suggestions text[];
  v_base text;
  v_random_suffix text;
BEGIN
  -- Normalize: lowercase, replace non-alphanumeric with hyphens, trim
  v_normalized := lower(regexp_replace(trim(p_handle), '[^a-z0-9]+', '-', 'g'));
  v_normalized := regexp_replace(v_normalized, '^-+|-+$', '', 'g'); -- trim leading/trailing hyphens
  
  -- Validate length and format
  IF length(v_normalized) < 3 OR length(v_normalized) > 30 OR v_normalized ~ '^-|-$' THEN
    RETURN QUERY SELECT false, v_normalized, ARRAY[]::text[];
    RETURN;
  END IF;
  
  -- Check if taken (in entities or reserved)
  IF EXISTS(SELECT 1 FROM entities WHERE handle_lower = v_normalized)
     OR EXISTS(SELECT 1 FROM handle_reservations WHERE handle = v_normalized AND expires_at > now()) THEN
    
    -- Generate suggestions
    v_base := v_normalized;
    v_random_suffix := substr(md5(v_normalized || now()::text), 1, 3);
    
    v_suggestions := ARRAY[
      v_base || '-shop',
      v_base || '-co',
      v_base || '-' || to_char(extract(epoch from now())::int % 999, 'FM000'),
      v_base || '-' || v_random_suffix,
      regexp_replace(v_base, '-', '', 'g') -- remove hyphens version
    ];
    
    RETURN QUERY SELECT false, v_normalized, v_suggestions;
  ELSE
    RETURN QUERY SELECT true, v_normalized, ARRAY[]::text[];
  END IF;
END;
$$;

-- RPC: Reserve business handle (10 min hold)
CREATE OR REPLACE FUNCTION reserve_business_handle(p_handle text, p_minutes int DEFAULT 10)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_normalized text;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Normalize handle
  v_normalized := lower(regexp_replace(trim(p_handle), '[^a-z0-9]+', '-', 'g'));
  v_normalized := regexp_replace(v_normalized, '^-+|-+$', '', 'g');
  
  -- Cleanup expired first
  DELETE FROM handle_reservations WHERE expires_at < now();
  
  -- Insert or update reservation
  INSERT INTO handle_reservations(handle, user_id, expires_at)
  VALUES (v_normalized, v_user_id, now() + (p_minutes || ' minutes')::interval)
  ON CONFLICT (handle) DO UPDATE 
  SET user_id = EXCLUDED.user_id, 
      expires_at = EXCLUDED.expires_at
  WHERE handle_reservations.expires_at < now(); -- Only update if expired
  
  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    RETURN false;
END;
$$;

-- RPC: Release handle reservation (when setup completes/cancels)
CREATE OR REPLACE FUNCTION release_business_handle(p_handle text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_normalized text;
BEGIN
  v_normalized := lower(regexp_replace(trim(p_handle), '[^a-z0-9]+', '-', 'g'));
  
  DELETE FROM handle_reservations 
  WHERE handle = v_normalized 
    AND user_id = auth.uid();
  
  RETURN true;
END;
$$;