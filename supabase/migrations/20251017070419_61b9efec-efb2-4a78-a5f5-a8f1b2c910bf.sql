-- PR4.1: Rocker next best actions RPC

CREATE OR REPLACE FUNCTION public.rocker_next_best_actions(p_user_id uuid)
RETURNS TABLE(
  action_type text,
  title text,
  description text,
  link text,
  priority int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Action 1: Create first listing
  SELECT 
    'create_listing' as action_type,
    'List your first item' as title,
    'Start earning by listing items in the marketplace' as description,
    '/listings/new' as link,
    1 as priority
  WHERE NOT EXISTS (
    SELECT 1 FROM marketplace_listings ml
    JOIN profiles p ON p.id = ml.seller_profile_id
    WHERE p.user_id = p_user_id
  )
  
  UNION ALL
  
  -- Action 2: Complete profile
  SELECT 
    'complete_profile' as action_type,
    'Complete your profile' as title,
    'Add more details to attract followers' as description,
    '/profile' as link,
    2 as priority
  WHERE EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_user_id 
    AND (bio IS NULL OR avatar_url IS NULL)
  )
  
  UNION ALL
  
  -- Action 3: Claim an entity
  SELECT 
    'claim_entity' as action_type,
    'Claim your business' as title,
    'Verify ownership of your business entities' as description,
    '/entities' as link,
    3 as priority
  WHERE NOT EXISTS (
    SELECT 1 FROM entities WHERE owner_user_id = p_user_id
  )
  
  ORDER BY priority
  LIMIT 3;
$$;