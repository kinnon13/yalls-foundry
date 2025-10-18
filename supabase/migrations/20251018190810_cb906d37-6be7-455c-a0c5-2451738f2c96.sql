-- RPC function to count entities by kind that user controls
CREATE OR REPLACE FUNCTION entity_counts_by_kind(p_user_id uuid)
RETURNS TABLE(kind text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.kind::text as kind, 
    COUNT(*)::bigint as count
  FROM entities e
  WHERE e.owner_user_id = p_user_id
  GROUP BY e.kind;
$$;