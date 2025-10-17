-- PR5b: Fix feed fusion RPCs - lanes, ratios, spacing, ordering

-- Drop old versions
DROP FUNCTION IF EXISTS feed_fusion_home(uuid, text, timestamptz, int);
DROP FUNCTION IF EXISTS feed_fusion_profile(uuid, uuid, text, timestamptz, int);

-- feed_fusion_home with correct lane contract and blend enforcement
CREATE OR REPLACE FUNCTION feed_fusion_home(
  p_user_id uuid,
  p_lane text,  -- 'for_you' | 'following' | 'shop'
  p_cursor timestamptz DEFAULT now(),
  p_limit int DEFAULT 20
) RETURNS TABLE(
  item_type text,
  item_id uuid,
  score numeric,
  created_at timestamptz,
  payload jsonb
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_post_target int;
  v_listing_target int;
  v_event_target int;
  v_event_horizon_days int;
BEGIN
  -- Set targets based on lane (post/listing/event %)
  IF p_lane = 'for_you' THEN
    v_post_target := (p_limit * 60 / 100);
    v_listing_target := (p_limit * 25 / 100);
    v_event_target := (p_limit * 15 / 100);
    v_event_horizon_days := 30;
  ELSIF p_lane = 'following' THEN
    v_post_target := (p_limit * 80 / 100);
    v_listing_target := (p_limit * 15 / 100);
    v_event_target := (p_limit * 5 / 100);
    v_event_horizon_days := 90;
  ELSIF p_lane = 'shop' THEN
    v_post_target := (p_limit * 10 / 100);
    v_listing_target := (p_limit * 85 / 100);
    v_event_target := (p_limit * 5 / 100);
    v_event_horizon_days := 14;
  ELSE
    RAISE EXCEPTION 'Invalid lane: %', p_lane;
  END IF;

  RETURN QUERY
  WITH owned_entities AS (
    SELECT e.id FROM entities e WHERE e.owner_user_id = p_user_id
    UNION
    SELECT em.entity_id FROM entity_members em WHERE em.member_user_id = p_user_id
  ),
  posts_base AS (
    SELECT 
      'post'::text AS kind,
      p.id,
      p.created_at,
      extract(epoch from (p_cursor - p.created_at))/3600.0 AS hours,
      p.body,
      p.media,
      p.author_user_id,
      p.entity_id,
      COALESCE((p.metadata->>'social_score')::numeric, 0) AS social_score,
      COALESCE((p.metadata->>'shop_score')::numeric, 0) AS shop_score
    FROM posts p
    JOIN post_targets pt ON pt.post_id = p.id AND pt.approved = true
    LEFT JOIN feed_hides fh ON fh.post_id = p.id AND fh.entity_id = pt.target_entity_id
    WHERE p.created_at <= p_cursor
      AND fh.post_id IS NULL
      AND (
        (p_lane = 'for_you') OR
        (p_lane = 'following' AND pt.target_entity_id IN (SELECT id FROM owned_entities)) OR
        (p_lane = 'shop' AND p.metadata->>'shoppable' = 'true')
      )
  ),
  posts_scored AS (
    SELECT
      kind,
      id,
      created_at,
      (1.0 * exp(-hours/48.0) + 0.6 * social_score + 0.8 * shop_score) AS score,
      jsonb_build_object(
        'kind', 'post',
        'id', id,
        'body', body,
        'media', COALESCE(media, '[]'::jsonb),
        'author_user_id', author_user_id,
        'entity_id', entity_id
      ) AS payload
    FROM posts_base
    ORDER BY score DESC, created_at DESC
    LIMIT v_post_target
  ),
  listings_base AS (
    SELECT
      'listing'::text AS kind,
      ml.id,
      ml.created_at,
      extract(epoch from (p_cursor - ml.created_at))/3600.0 AS hours,
      ml.title,
      ml.price_cents,
      ml.media,
      ml.seller_entity_id,
      ml.stock_quantity
    FROM marketplace_listings ml
    WHERE ml.status = 'active'
      AND ml.created_at <= p_cursor
      AND (
        (p_lane IN ('for_you', 'shop')) OR
        (p_lane = 'following' AND ml.seller_entity_id IN (SELECT id FROM owned_entities))
      )
  ),
  listings_scored AS (
    SELECT
      kind,
      id,
      created_at,
      (1.0 * exp(-hours/48.0)) AS score,
      jsonb_build_object(
        'kind', 'listing',
        'id', id,
        'title', title,
        'price_cents', price_cents,
        'media', COALESCE(media, '[]'::jsonb),
        'entity_id', seller_entity_id,
        'stock_quantity', stock_quantity
      ) AS payload
    FROM listings_base
    ORDER BY score DESC, created_at DESC
    LIMIT v_listing_target
  ),
  events_base AS (
    SELECT
      'event'::text AS kind,
      e.id,
      e.created_at,
      e.starts_at,
      e.title,
      e.location,
      e.host_entity_id
    FROM events e
    WHERE e.starts_at >= p_cursor
      AND e.starts_at <= p_cursor + make_interval(days => v_event_horizon_days)
      AND (
        (p_lane IN ('for_you', 'shop')) OR
        (p_lane = 'following' AND e.host_entity_id IN (SELECT id FROM owned_entities))
      )
  ),
  events_scored AS (
    SELECT
      kind,
      id,
      created_at,
      1.0 AS score,
      jsonb_build_object(
        'kind', 'event',
        'id', id,
        'title', title,
        'starts_at', starts_at,
        'location', location,
        'entity_id', host_entity_id
      ) AS payload
    FROM events_base
    ORDER BY starts_at ASC
    LIMIT v_event_target
  ),
  combined AS (
    SELECT kind AS item_type, id AS item_id, score, created_at, payload FROM posts_scored
    UNION ALL
    SELECT kind AS item_type, id AS item_id, score, created_at, payload FROM listings_scored
    UNION ALL
    SELECT kind AS item_type, id AS item_id, score, created_at, payload FROM events_scored
  )
  SELECT c.item_type, c.item_id, c.score, c.created_at, c.payload
  FROM combined c
  ORDER BY c.score DESC, c.created_at DESC;
END $$;

-- feed_fusion_profile with correct lane contract
CREATE OR REPLACE FUNCTION feed_fusion_profile(
  p_entity_id uuid,
  p_user_id uuid,
  p_lane text,  -- 'this' | 'combined'
  p_cursor timestamptz DEFAULT now(),
  p_limit int DEFAULT 20
) RETURNS TABLE(
  item_type text,
  item_id uuid,
  score numeric,
  created_at timestamptz,
  payload jsonb
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH posts_base AS (
    SELECT 
      'post'::text AS kind,
      p.id,
      p.created_at,
      extract(epoch from (p_cursor - p.created_at))/3600.0 AS hours,
      p.body,
      p.media,
      p.author_user_id,
      p.entity_id
    FROM posts p
    JOIN post_targets pt ON pt.post_id = p.id AND pt.approved = true
    LEFT JOIN feed_hides fh ON fh.post_id = p.id AND fh.entity_id = pt.target_entity_id
    WHERE p.created_at <= p_cursor
      AND fh.post_id IS NULL
      AND (
        (p_lane = 'this' AND pt.target_entity_id = p_entity_id) OR
        (p_lane = 'combined')
      )
  ),
  posts_scored AS (
    SELECT
      kind,
      id,
      created_at,
      (1.0 * exp(-hours/48.0)) AS score,
      jsonb_build_object(
        'kind', 'post',
        'id', id,
        'body', body,
        'media', COALESCE(media, '[]'::jsonb),
        'author_user_id', author_user_id,
        'entity_id', entity_id
      ) AS payload
    FROM posts_base
  ),
  listings_base AS (
    SELECT
      'listing'::text AS kind,
      ml.id,
      ml.created_at,
      extract(epoch from (p_cursor - ml.created_at))/3600.0 AS hours,
      ml.title,
      ml.price_cents,
      ml.media,
      ml.seller_entity_id,
      ml.stock_quantity
    FROM marketplace_listings ml
    WHERE ml.status = 'active'
      AND ml.created_at <= p_cursor
      AND (
        (p_lane = 'this' AND ml.seller_entity_id = p_entity_id) OR
        (p_lane = 'combined')
      )
  ),
  listings_scored AS (
    SELECT
      kind,
      id,
      created_at,
      (1.0 * exp(-hours/48.0)) AS score,
      jsonb_build_object(
        'kind', 'listing',
        'id', id,
        'title', title,
        'price_cents', price_cents,
        'media', COALESCE(media, '[]'::jsonb),
        'entity_id', seller_entity_id,
        'stock_quantity', stock_quantity
      ) AS payload
    FROM listings_base
  ),
  events_base AS (
    SELECT
      'event'::text AS kind,
      e.id,
      e.created_at,
      e.starts_at,
      e.title,
      e.location,
      e.host_entity_id
    FROM events e
    WHERE e.starts_at >= p_cursor
      AND (
        (p_lane = 'this' AND e.host_entity_id = p_entity_id) OR
        (p_lane = 'combined')
      )
  ),
  events_scored AS (
    SELECT
      kind,
      id,
      created_at,
      1.0 AS score,
      jsonb_build_object(
        'kind', 'event',
        'id', id,
        'title', title,
        'starts_at', starts_at,
        'location', location,
        'entity_id', host_entity_id
      ) AS payload
    FROM events_base
  ),
  combined AS (
    SELECT kind AS item_type, id AS item_id, score, created_at, payload FROM posts_scored
    UNION ALL
    SELECT kind AS item_type, id AS item_id, score, created_at, payload FROM listings_scored
    UNION ALL
    SELECT kind AS item_type, id AS item_id, score, created_at, payload FROM events_scored
  )
  SELECT c.item_type, c.item_id, c.score, c.created_at, c.payload
  FROM combined c
  ORDER BY c.score DESC, c.created_at DESC
  LIMIT p_limit;
END $$;