-- Fix function return type changes by dropping first
DROP FUNCTION IF EXISTS public.feed_fusion_home(uuid, text);
DROP FUNCTION IF EXISTS public.feed_fusion_profile(uuid, text);

-- Recreate with correct signatures
CREATE OR REPLACE FUNCTION public.feed_fusion_home(
  p_user_id uuid, 
  p_mode text DEFAULT 'combined',
  p_cursor_ts timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS TABLE(
  item_type text, item_id uuid, entity_id uuid, created_at timestamptz,
  rank numeric, payload jsonb, next_cursor_ts timestamptz, next_cursor_id uuid
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  w_recency numeric := 1.0;
  w_social numeric := 0.6;
  w_shop numeric := 0.8;
  w_fit numeric := 0.5;
  v_target_reels int := FLOOR(p_limit * 0.60);
  v_target_listings int := FLOOR(p_limit * 0.25);
  v_target_events int := FLOOR(p_limit * 0.15);
BEGIN
  IF NOT check_rate_limit('feed_fusion_home:'||p_user_id::text, 120, 60) THEN
    RAISE EXCEPTION 'Rate limit' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  WITH cart_items AS (
    SELECT sci.listing_id FROM shopping_cart_items sci
    JOIN shopping_carts sc ON sc.id = sci.cart_id
    WHERE sc.user_id = p_user_id
  ),
  hidden_items AS (
    SELECT item_id, item_type FROM feed_hides WHERE user_id = p_user_id
  ),
  reels AS (
    SELECT 
      'reel'::text as typ, p.id, p.author_user_id as eid, p.created_at,
      (w_recency * EXTRACT(EPOCH FROM (now() - p.created_at)) / -3600.0 +
       w_social * COALESCE((p.metadata->>'likes_count')::numeric, 0) * 0.01) as score
    FROM posts p
    WHERE p.kind = 'video' 
      AND (p_cursor_ts IS NULL OR p.created_at < p_cursor_ts OR (p.created_at = p_cursor_ts AND p.id < p_cursor_id))
      AND NOT EXISTS (SELECT 1 FROM hidden_items h WHERE h.item_id = p.id AND h.item_type = 'reel')
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT v_target_reels
  ),
  listings AS (
    SELECT 
      'listing'::text as typ, l.id, l.seller_user_id as eid, l.created_at,
      (w_recency * EXTRACT(EPOCH FROM (now() - l.created_at)) / -3600.0 +
       w_shop * COALESCE(l.price_cents, 0) * 0.0001) as score
    FROM marketplace_listings l
    WHERE l.status = 'active'
      AND (p_cursor_ts IS NULL OR l.created_at < p_cursor_ts OR (l.created_at = p_cursor_ts AND l.id < p_cursor_id))
      AND NOT EXISTS (SELECT 1 FROM cart_items ci WHERE ci.listing_id = l.id)
      AND NOT EXISTS (SELECT 1 FROM hidden_items h WHERE h.item_id = l.id AND h.item_type = 'listing')
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT v_target_listings
  ),
  events AS (
    SELECT 
      'event'::text as typ, e.id, e.host_profile_id as eid, e.starts_at as created_at,
      (w_recency * EXTRACT(EPOCH FROM (now() - e.starts_at)) / -3600.0) as score
    FROM events e
    WHERE e.starts_at > now()
      AND (p_cursor_ts IS NULL OR e.starts_at < p_cursor_ts OR (e.starts_at = p_cursor_ts AND e.id < p_cursor_id))
      AND NOT EXISTS (SELECT 1 FROM hidden_items h WHERE h.item_id = e.id AND h.item_type = 'event')
    ORDER BY e.starts_at DESC, e.id DESC
    LIMIT v_target_events
  ),
  combined AS (
    SELECT typ, id, eid, created_at, score FROM reels
    UNION ALL SELECT typ, id, eid, created_at, score FROM listings
    UNION ALL SELECT typ, id, eid, created_at, score FROM events
  ),
  ranked AS (
    SELECT 
      c.typ, c.id, c.eid, c.created_at, c.score,
      LAG(c.eid) OVER (ORDER BY c.score DESC, c.created_at DESC) as prev_seller
    FROM combined c
    ORDER BY c.score DESC, c.created_at DESC
    LIMIT p_limit + 10
  ),
  deduped AS (
    SELECT r.* FROM ranked r
    WHERE r.typ != 'listing' OR r.eid IS DISTINCT FROM r.prev_seller
    LIMIT p_limit
  )
  SELECT 
    d.typ, d.id, d.eid, d.created_at, d.score,
    jsonb_build_object('type', d.typ, 'id', d.id),
    LEAD(d.created_at) OVER (ORDER BY d.score DESC, d.created_at DESC),
    LEAD(d.id) OVER (ORDER BY d.score DESC, d.created_at DESC)
  FROM deduped d
  ORDER BY d.score DESC, d.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.feed_fusion_profile(
  p_entity_id uuid, 
  p_mode text DEFAULT 'this_page',
  p_cursor_ts timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit int DEFAULT 30
)
RETURNS TABLE(
  item_type text, item_id uuid, entity_id uuid, created_at timestamptz,
  rank numeric, payload jsonb, next_cursor_ts timestamptz, next_cursor_id uuid
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT check_rate_limit('feed_fusion_profile:'||p_entity_id::text, 120, 60) THEN
    RAISE EXCEPTION 'Rate limit' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  WITH profile_posts AS (
    SELECT 
      'reel'::text as typ, p.id, p.author_user_id as eid, p.created_at,
      EXTRACT(EPOCH FROM (now() - p.created_at)) / -3600.0 as score
    FROM posts p
    WHERE p.author_user_id = p_entity_id
      AND (p_cursor_ts IS NULL OR p.created_at < p_cursor_ts OR (p.created_at = p_cursor_ts AND p.id < p_cursor_id))
    ORDER BY p.created_at DESC
    LIMIT p_limit
  ),
  profile_listings AS (
    SELECT 
      'listing'::text as typ, l.id, l.seller_user_id as eid, l.created_at,
      EXTRACT(EPOCH FROM (now() - l.created_at)) / -3600.0 as score
    FROM marketplace_listings l
    WHERE l.seller_user_id = p_entity_id AND l.status = 'active'
      AND (p_cursor_ts IS NULL OR l.created_at < p_cursor_ts OR (l.created_at = p_cursor_ts AND l.id < p_cursor_id))
    ORDER BY l.created_at DESC
    LIMIT p_limit
  ),
  profile_events AS (
    SELECT 
      'event'::text as typ, e.id, e.host_profile_id as eid, e.starts_at as created_at,
      EXTRACT(EPOCH FROM (now() - e.starts_at)) / -3600.0 as score
    FROM events e
    WHERE e.host_profile_id = p_entity_id AND e.starts_at > now()
      AND (p_cursor_ts IS NULL OR e.starts_at < p_cursor_ts OR (e.starts_at = p_cursor_ts AND e.id < p_cursor_id))
    ORDER BY e.starts_at DESC
    LIMIT p_limit
  ),
  combined AS (
    SELECT * FROM profile_posts
    UNION ALL SELECT * FROM profile_listings
    UNION ALL SELECT * FROM profile_events
  )
  SELECT 
    c.typ, c.id, c.eid, c.created_at, c.score,
    jsonb_build_object('type', c.typ, 'id', c.id),
    LEAD(c.created_at) OVER (ORDER BY c.created_at DESC),
    LEAD(c.id) OVER (ORDER BY c.created_at DESC)
  FROM combined c
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END $$;

-- Add _log_rpc call to hot functions for metrics
CREATE OR REPLACE FUNCTION public._log_rpc(p_rpc_name text, p_duration_ms int, p_error text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.rpc_metrics(rpc_name, duration_ms, error, created_at)
  VALUES (p_rpc_name, p_duration_ms, p_error, now());
END $$;