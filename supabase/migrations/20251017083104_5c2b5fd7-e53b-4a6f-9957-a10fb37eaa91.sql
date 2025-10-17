-- PR5b: Add reason labels to feed fusion payloads

-- Update feed_fusion_home to include labels array in post payloads
CREATE OR REPLACE FUNCTION public.feed_fusion_home(
  p_user_id uuid,
  p_lane text,
  p_cursor timestamptz DEFAULT now(),
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  item_type text,
  item_id uuid,
  score numeric,
  created_at timestamptz,
  payload jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_target int;
  v_listing_target int;
  v_event_target int;
BEGIN
  -- Lane-specific blend targets
  IF p_lane = 'for_you' THEN
    v_post_target := 12; v_listing_target := 5; v_event_target := 3;
  ELSIF p_lane = 'following' THEN
    v_post_target := 16; v_listing_target := 3; v_event_target := 1;
  ELSIF p_lane = 'shop' THEN
    v_post_target := 2; v_listing_target := 17; v_event_target := 1;
  ELSE
    v_post_target := 12; v_listing_target := 5; v_event_target := 3;
  END IF;

  RETURN QUERY
  WITH followed_entities AS (
    SELECT target_entity_id
    FROM entity_edges
    WHERE source_entity_id IN (
      SELECT id FROM entities WHERE owner_user_id = p_user_id
    ) AND kind = 'follow'
  ),
  hidden_posts AS (
    SELECT post_id FROM feed_hides
    WHERE entity_id IN (SELECT id FROM entities WHERE owner_user_id = p_user_id)
  ),
  posts_cte AS (
    SELECT 
      'post'::text as item_type,
      p.id as item_id,
      (1.0 * exp(-extract(epoch from (p_cursor - p.created_at))/172800.0) + 
       0.6 * coalesce((p.metadata->>'social_score')::numeric, 0) +
       0.5 * CASE WHEN pt.target_entity_id IN (SELECT * FROM followed_entities) THEN 1 ELSE 0 END
      ) as score,
      p.created_at,
      jsonb_build_object(
        'kind', 'post',
        'id', p.id,
        'body', p.body,
        'media', coalesce(p.media, '[]'::jsonb),
        'author_user_id', p.author_user_id,
        'entity_id', pt.target_entity_id,
        'labels', CASE 
          WHEN pt.source_post_id IS NOT NULL THEN 
            CASE WHEN p.author_user_id != (SELECT owner_user_id FROM entities WHERE id = pt.target_entity_id)
              THEN jsonb_build_array('repost', 'cross_post')
              ELSE jsonb_build_array('repost')
            END
          WHEN pt.reason ILIKE '%auto%' OR EXISTS(
            SELECT 1 FROM entity_edges ee 
            WHERE ee.target_entity_id = pt.target_entity_id 
            AND ee.metadata->>'auto_propagate' = 'true'
          ) THEN jsonb_build_array('auto')
          WHEN p.author_user_id != (SELECT owner_user_id FROM entities WHERE id = pt.target_entity_id)
            THEN jsonb_build_array('cross_post')
          ELSE '[]'::jsonb
        END
      ) as payload
    FROM posts p
    JOIN post_targets pt ON pt.post_id = p.id
    WHERE pt.approved = true
      AND p.created_at < p_cursor
      AND p.id NOT IN (SELECT * FROM hidden_posts)
      AND (p_lane != 'following' OR pt.target_entity_id IN (SELECT * FROM followed_entities))
    ORDER BY score DESC, p.created_at DESC
    LIMIT v_post_target
  ),
  listings_cte AS (
    SELECT 
      'listing'::text,
      l.id,
      (1.0 * exp(-extract(epoch from (p_cursor - l.created_at))/172800.0) + 
       0.8 * coalesce((l.metadata->>'shop_score')::numeric, 0)
      ) as score,
      l.created_at,
      jsonb_build_object(
        'kind', 'listing',
        'id', l.id,
        'title', l.title,
        'price_cents', l.price_cents,
        'media', coalesce(l.media, '[]'::jsonb),
        'stock_quantity', l.stock_quantity,
        'entity_id', l.seller_entity_id
      )
    FROM marketplace_listings l
    WHERE l.status = 'active'
      AND l.created_at < p_cursor
      AND (p_lane != 'following' OR l.seller_entity_id IN (SELECT * FROM followed_entities))
    ORDER BY score DESC, l.created_at DESC
    LIMIT v_listing_target
  ),
  events_cte AS (
    SELECT 
      'event'::text,
      e.id,
      (1.0 * exp(-extract(epoch from (e.starts_at - p_cursor))/172800.0)) as score,
      e.created_at,
      jsonb_build_object(
        'kind', 'event',
        'id', e.id,
        'title', e.title,
        'starts_at', e.starts_at,
        'location', e.location,
        'entity_id', e.host_entity_id
      )
    FROM events e
    WHERE e.starts_at > p_cursor
      AND e.starts_at < p_cursor + 
        CASE p_lane 
          WHEN 'for_you' THEN interval '30 days'
          WHEN 'following' THEN interval '90 days'
          WHEN 'shop' THEN interval '14 days'
          ELSE interval '30 days'
        END
      AND (p_lane != 'following' OR e.host_entity_id IN (SELECT * FROM followed_entities))
    ORDER BY score DESC, e.created_at DESC
    LIMIT v_event_target
  )
  SELECT * FROM posts_cte
  UNION ALL
  SELECT * FROM listings_cte
  UNION ALL
  SELECT * FROM events_cte
  ORDER BY score DESC, created_at DESC
  LIMIT p_limit;
END;
$$;

-- Update feed_fusion_profile similarly
CREATE OR REPLACE FUNCTION public.feed_fusion_profile(
  p_entity_id uuid,
  p_user_id uuid,
  p_lane text,
  p_cursor timestamptz DEFAULT now(),
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  item_type text,
  item_id uuid,
  score numeric,
  created_at timestamptz,
  payload jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH hidden_posts AS (
    SELECT post_id FROM feed_hides WHERE entity_id = p_entity_id
  ),
  posts_cte AS (
    SELECT 
      'post'::text,
      p.id,
      extract(epoch from (p_cursor - p.created_at))::numeric as score,
      p.created_at,
      jsonb_build_object(
        'kind', 'post',
        'id', p.id,
        'body', p.body,
        'media', coalesce(p.media, '[]'::jsonb),
        'author_user_id', p.author_user_id,
        'entity_id', pt.target_entity_id,
        'labels', CASE 
          WHEN pt.source_post_id IS NOT NULL THEN 
            CASE WHEN p.author_user_id != (SELECT owner_user_id FROM entities WHERE id = p_entity_id)
              THEN jsonb_build_array('repost', 'cross_post')
              ELSE jsonb_build_array('repost')
            END
          WHEN pt.reason ILIKE '%auto%' THEN jsonb_build_array('auto')
          WHEN p.author_user_id != (SELECT owner_user_id FROM entities WHERE id = p_entity_id)
            THEN jsonb_build_array('cross_post')
          ELSE '[]'::jsonb
        END
      )
    FROM posts p
    JOIN post_targets pt ON pt.post_id = p.id
    WHERE (
      (p_lane = 'this' AND pt.target_entity_id = p_entity_id)
      OR (p_lane = 'combined' AND (
        pt.target_entity_id = p_entity_id
        OR pt.target_entity_id IN (
          SELECT target_entity_id FROM entity_edges 
          WHERE source_entity_id = p_entity_id AND kind = 'follow'
        )
      ))
    )
      AND pt.approved = true
      AND p.created_at < p_cursor
      AND p.id NOT IN (SELECT * FROM hidden_posts)
    ORDER BY p.created_at DESC
    LIMIT p_limit
  ),
  listings_cte AS (
    SELECT 
      'listing'::text,
      l.id,
      extract(epoch from (p_cursor - l.created_at))::numeric,
      l.created_at,
      jsonb_build_object(
        'kind', 'listing',
        'id', l.id,
        'title', l.title,
        'price_cents', l.price_cents,
        'media', coalesce(l.media, '[]'::jsonb),
        'stock_quantity', l.stock_quantity,
        'entity_id', l.seller_entity_id
      )
    FROM marketplace_listings l
    WHERE l.seller_entity_id = p_entity_id
      AND l.status = 'active'
      AND l.created_at < p_cursor
      AND p_lane = 'this'
    ORDER BY l.created_at DESC
    LIMIT CASE WHEN p_lane = 'this' THEN p_limit ELSE 0 END
  ),
  events_cte AS (
    SELECT 
      'event'::text,
      e.id,
      extract(epoch from (p_cursor - e.created_at))::numeric,
      e.created_at,
      jsonb_build_object(
        'kind', 'event',
        'id', e.id,
        'title', e.title,
        'starts_at', e.starts_at,
        'location', e.location,
        'entity_id', e.host_entity_id
      )
    FROM events e
    WHERE e.host_entity_id = p_entity_id
      AND e.starts_at > now()
      AND p_lane = 'this'
    ORDER BY e.starts_at ASC
    LIMIT CASE WHEN p_lane = 'this' THEN p_limit ELSE 0 END
  )
  SELECT * FROM posts_cte
  UNION ALL
  SELECT * FROM listings_cte
  UNION ALL
  SELECT * FROM events_cte
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$;