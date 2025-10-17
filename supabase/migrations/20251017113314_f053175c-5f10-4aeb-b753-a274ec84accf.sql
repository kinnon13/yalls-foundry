-- Add claim tracking columns
ALTER TABLE public.entity_profiles
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Enable RLS
ALTER TABLE public.entity_profiles ENABLE ROW LEVEL SECURITY;

-- Read policies: unclaimed (public) + owned (private)
DROP POLICY IF EXISTS ep_select_unclaimed ON public.entity_profiles;
CREATE POLICY ep_select_unclaimed
  ON public.entity_profiles FOR SELECT TO authenticated
  USING (is_claimed = false);

DROP POLICY IF EXISTS ep_select_owned ON public.entity_profiles;
CREATE POLICY ep_select_owned
  ON public.entity_profiles FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ep_unclaimed_type_name
  ON public.entity_profiles(entity_type, name) WHERE is_claimed = false;

CREATE INDEX IF NOT EXISTS idx_ep_owner
  ON public.entity_profiles(owner_id);

-- Safe search (RLS-aware, no definer needed)
CREATE OR REPLACE FUNCTION public.search_unclaimed_profiles(
  p_type text,
  p_limit int DEFAULT 20
)
RETURNS TABLE(id uuid, name text, entity_type text, description text)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT id, name, entity_type::text as entity_type, description
  FROM public.entity_profiles
  WHERE is_claimed = false
    AND entity_type::text = p_type
  ORDER BY name
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;

GRANT EXECUTE ON FUNCTION public.search_unclaimed_profiles(text,int) TO authenticated;

-- Race-safe atomic claim
CREATE OR REPLACE FUNCTION public.claim_profile(
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claimed boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Atomic claim: only first caller wins
  UPDATE public.entity_profiles
     SET is_claimed = true,
         owner_id   = auth.uid(),
         claimed_at = now()
   WHERE id = p_profile_id
     AND is_claimed = false
  RETURNING true INTO v_claimed;

  -- Log to observability
  IF v_claimed THEN
    PERFORM public.rpc_observe('claim_profile', 0, 'ok', NULL,
      jsonb_build_object('profile_id', p_profile_id));
  ELSE
    PERFORM public.rpc_observe('claim_profile', 0, 'error', 'ALREADY_CLAIMED',
      jsonb_build_object('profile_id', p_profile_id));
  END IF;

  RETURN COALESCE(v_claimed, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_profile(uuid) TO authenticated;