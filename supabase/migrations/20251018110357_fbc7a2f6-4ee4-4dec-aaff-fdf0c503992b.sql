-- Create function to get aggregated social stats (simplified version for existing schema)
CREATE OR REPLACE FUNCTION user_aggregate_social_stats(p_user_id uuid)
RETURNS TABLE (
  total_following bigint,
  total_followers bigint,
  total_likes bigint
) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  WITH owned_entities AS (
    SELECT id FROM entities WHERE owner_user_id = p_user_id
  ),
  post_count AS (
    SELECT COALESCE(COUNT(*), 0) as c 
    FROM posts p
    WHERE p.entity_id IN (SELECT id FROM owned_entities)
  )
  SELECT
    0::bigint as total_following,
    0::bigint as total_followers,
    (SELECT c FROM post_count) as total_likes;
$$;