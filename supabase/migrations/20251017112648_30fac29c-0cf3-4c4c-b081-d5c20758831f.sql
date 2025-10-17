-- Indexes for unclaimed profile search
CREATE INDEX IF NOT EXISTS idx_entity_profiles_unclaimed
  ON entity_profiles(entity_type, is_claimed, name)
  WHERE is_claimed = false;

-- RLS policy for reading unclaimed profiles
DROP POLICY IF EXISTS ep_select_unclaimed_public ON entity_profiles;
CREATE POLICY ep_select_unclaimed_public ON entity_profiles
  FOR SELECT TO authenticated
  USING (is_claimed = false);

-- Search unclaimed profiles RPC (tenant-aware, observable)
CREATE OR REPLACE FUNCTION public.search_unclaimed_profiles(
  p_type text,
  p_limit int DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  name text,
  entity_type text,
  description text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ep.id, 
    ep.name, 
    ep.entity_type::text, 
    ep.description
  FROM entity_profiles ep
  WHERE ep.entity_type::text = p_type
    AND ep.is_claimed = false
  ORDER BY ep.name ASC
  LIMIT p_limit;
END;
$$;

-- Atomic claim RPC (race-safe)
CREATE OR REPLACE FUNCTION public.claim_profile(
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row uuid;
BEGIN
  UPDATE entity_profiles
  SET 
    is_claimed = true,
    claimed_by_user_id = auth.uid(),
    claimed_at = now()
  WHERE id = p_profile_id
    AND is_claimed = false
  RETURNING id INTO v_row;

  RETURN v_row IS NOT NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_unclaimed_profiles(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_profile(uuid) TO authenticated;