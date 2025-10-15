-- Universal entity search RPC with fuzzy matching
CREATE OR REPLACE FUNCTION public.search_entities(
  p_query TEXT,
  p_tenant_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  name TEXT,
  image_url TEXT,
  is_public BOOLEAN,
  similarity_score FLOAT,
  metadata JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    -- Profiles
    SELECT 
      'profile'::TEXT as entity_type,
      p.id as entity_id,
      COALESCE(p.display_name, p.user_id::TEXT) as name,
      p.avatar_url as image_url,
      TRUE as is_public, -- profiles are public by default
      similarity(COALESCE(p.display_name, ''), p_query) as similarity_score,
      jsonb_build_object(
        'bio', p.bio,
        'user_id', p.user_id
      ) as metadata
    FROM profiles p
    WHERE p.deleted_at IS NULL
      AND (
        COALESCE(p.display_name, '') ILIKE '%' || p_query || '%'
        OR p.user_id::TEXT ILIKE '%' || p_query || '%'
      )
    
    UNION ALL
    
    -- Horses
    SELECT
      'horse'::TEXT,
      e.id,
      e.name,
      e.custom_fields->>'profile_image_url' as image_url,
      TRUE as is_public,
      similarity(e.name, p_query),
      jsonb_build_object(
        'description', e.description,
        'owner_id', e.owner_id,
        'is_claimed', e.is_claimed
      )
    FROM entity_profiles e
    WHERE e.entity_type = 'horse'
      AND e.name ILIKE '%' || p_query || '%'
    
    UNION ALL
    
    -- Businesses
    SELECT
      'business'::TEXT,
      b.id,
      b.name,
      b.capabilities->>'logo_url' as image_url,
      NOT b.frozen as is_public,
      similarity(b.name, p_query),
      jsonb_build_object(
        'description', b.description,
        'slug', b.slug,
        'owner_id', b.owner_id
      )
    FROM businesses b
    WHERE NOT b.frozen
      AND b.name ILIKE '%' || p_query || '%'
  ) results
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$;

-- Enable pg_trgm for fuzzy matching if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_entities TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_entities TO anon;