-- Drop and recreate feed_fusion_home with production-grade fixes
DROP FUNCTION IF EXISTS public.feed_fusion_home(uuid, text, timestamptz, uuid, int);

CREATE OR REPLACE FUNCTION public.feed_fusion_home(
  p_user_id   uuid,
  p_mode      text DEFAULT 'for_you',
  p_cursor_ts timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit     int  DEFAULT 50
)
RETURNS TABLE(
  item_type text,
  item_id uuid,
  entity_id uuid,
  created_at timestamptz,
  rank numeric,
  payload jsonb,
  next_cursor_ts timestamptz,
  next_cursor_id uuid
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  w_recency numeric := 1.0;
  w_social  numeric := 0.6;
  w_shop    numeric := 0.8;
  w_fit     numeric := 0.5;

  v_list_target int;
  v_post_target int;
  v_event_target int;

  v_cap_ratio numeric;

  v_mode text := lower(p_mode);
  v_cursor_ts timestamptz := p_cursor_ts;
  v_cursor_id uuid := p_cursor_id;
  v_has_more boolean := false;

  v_lane text :=
    case v_mode
      when 'combined'  then 'for_you'
      when 'personal'  then 'following'
      else v_mode
    end;
BEGIN
  IF NOT check_rate_limit('feed_fusion_home:'||COALESCE(p_user_id,'00000000-0000-0000-0000-000000000000')::text, 120, 60) THEN
    RAISE EXCEPTION 'Rate limit' USING ERRCODE='42501';
  END IF;

  -- lane presets
  IF v_lane = 'for_you' THEN
    v_post_target  := GREATEST(1, ceil(p_limit * 0.60));
    v_list_target  := GREATEST(1, ceil(p_limit * 0.25));
    v_event_target := GREATEST(1, floor(p_limit * 0.15));
    v_cap_ratio    := 0.50;
  ELSIF v_lane = 'following' THEN
    v_post_target  := GREATEST(1, ceil(p_limit * 0.80));
    v_list_target  := GREATEST(0, floor(p_limit * 0.05));
    v_event_target := GREATEST(1, floor(p_limit * 0.15));
    v_cap_ratio    := 0.33;
  ELSE -- 'shop'
    v_post_target  := GREATEST(0, floor(p_limit * 0.10));
    v_list_target  := GREATEST(1, ceil(p_limit * 0.85));
    v_event_target := GREATEST(0, floor(p_limit * 0.05));
    v_cap_ratio    := 0.66;
  END IF;

  RETURN QUERY
  WITH
  me_entities AS (
    SELECT e.id
      FROM entities e
     WHERE e.owner_user_id = p_user_id
    UNION
    SELECT ee.object_entity_id
      FROM entity_edges ee
     WHERE ee.subject_entity_id IN (SELECT id FROM entities WHERE owner_user_id = p_user_id)
       AND ee.relation_type = 'follows'
  ),
  posts_src AS (
    SELECT
      'post'::text AS typ,
      p.id,
      p.entity_id AS eid,
      p.created_at,
      ( w_recency * exp( - (EXTRACT(epoch FROM (now() - p.created_at)) / 3600.0) / 48.0 )
        + w_social  * COALESCE( (p.metadata->>'social_score')::numeric, 0)
        + w_fit     * COALESCE( (p.metadata->>'fit_score')::numeric,    0)
      ) AS score
    FROM posts p
    JOIN post_targets pt ON pt.post_id = p.id AND pt.approved = true
    LEFT JOIN feed_hides fh ON fh.user_id = p_user_id AND fh.item_type='reel' AND fh.item_id = p.id
    WHERE fh.item_id IS NULL
      AND (v_cursor_ts IS NULL OR p.created_at < v_cursor_ts OR (p.created_at = v_cursor_ts AND p.id < v_cursor_id))
      AND (
            v_lane <> 'following'
         OR  p.entity_id IN (SELECT id FROM me_entities)
      )
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT v_post_target
  ),
  listings_src AS (
    SELECT
      'listing'::text AS typ,
      l.id,
      l.seller_entity_id AS eid,
      l.created_at,
      ( w_recency * exp( - (EXTRACT(epoch FROM (now() - l.created_at)) / 3600.0) / 48.0 )
        + w_shop    * COALESCE( (l.metadata->>'shop_score')::numeric, 0)
        + w_fit     * COALESCE( (l.metadata->>'fit_score')::numeric,  0)
      ) AS score
    FROM marketplace_listings l
    LEFT JOIN feed_hides fh ON fh.user_id = p_user_id AND fh.item_type='listing' AND fh.item_id = l.id
    LEFT JOIN shopping_cart_items sci ON sci.user_id = p_user_id AND sci.listing_id = l.id
    WHERE l.status = 'active'
      AND fh.item_id IS NULL
      AND sci.listing_id IS NULL
      AND (v_cursor_ts IS NULL OR l.created_at < v_cursor_ts OR (l.created_at = v_cursor_ts AND l.id < v_cursor_id))
      AND (
            v_lane <> 'following'
         OR  l.seller_entity_id IN (SELECT id FROM me_entities)
      )
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT v_list_target
  ),
  events_src AS (
    SELECT
      'event'::text AS typ,
      e.id,
      e.host_entity_id AS eid,
      e.starts_at AS created_at,
      ( w_recency * exp( - (EXTRACT(epoch FROM (now() - e.starts_at)) / 3600.0) / 48.0 )
        + w_social  * COALESCE( (e.metadata->>'interest')::numeric, 0)
        + w_fit     * COALESCE( (e.metadata->>'fit_score')::numeric, 0)
      ) AS score
    FROM events e
    LEFT JOIN feed_hides fh ON fh.user_id = p_user_id AND fh.item_type='event' AND fh.item_id = e.id
    WHERE e.starts_at > now()
      AND fh.item_id IS NULL
      AND (v_cursor_ts IS NULL OR e.starts_at < v_cursor_ts OR (e.starts_at = v_cursor_ts AND e.id < v_cursor_id))
      AND (
            v_lane <> 'following'
         OR  e.host_entity_id IN (SELECT id FROM me_entities)
      )
    ORDER BY e.starts_at DESC, e.id DESC
    LIMIT v_event_target
  ),
  combined AS (
    SELECT * FROM posts_src
    UNION ALL
    SELECT * FROM listings_src
    UNION ALL
    SELECT * FROM events_src
  ),
  ranked AS (
    SELECT
      typ, id, eid, created_at, score,
      LAG(eid)   OVER (ORDER BY score DESC, created_at DESC, id DESC) AS prev_eid,
      LAG(score) OVER (ORDER BY score DESC, created_at DESC, id DESC) AS prev_score
    FROM combined
    ORDER BY score DESC, created_at DESC, id DESC
    LIMIT p_limit + 1
  ),
  dedup AS (
    SELECT *
    FROM ranked
    WHERE NOT (typ='listing' AND prev_eid = eid AND (score - COALESCE(prev_score, 0)) < 0.25)
  ),
  capped AS (
    SELECT *
    FROM (
      SELECT
        *,
        SUM(CASE WHEN typ='listing' THEN 1 ELSE 0 END) OVER (ORDER BY score DESC, created_at DESC, id DESC) AS listing_so_far,
        ROW_NUMBER() OVER (ORDER BY score DESC, created_at DESC, id DESC) AS rn
      FROM dedup
    ) s
    WHERE (listing_so_far::numeric / NULLIF(rn,0)) <= v_cap_ratio OR typ <> 'listing'
  ),
  page_plus_one AS (
    SELECT * FROM capped ORDER BY score DESC, created_at DESC, id DESC LIMIT p_limit + 1
  ),
  anchors AS (
    SELECT
      CASE WHEN COUNT(*) > p_limit THEN true ELSE false END AS has_more,
      (ARRAY_AGG(created_at ORDER BY score DESC, created_at DESC, id DESC))[p_limit+1] AS next_ts,
      (ARRAY_AGG(id         ORDER BY score DESC, created_at DESC, id DESC))[p_limit+1] AS next_id
    FROM page_plus_one
  ),
  page AS (
    SELECT * FROM page_plus_one
    ORDER BY score DESC, created_at DESC, id DESC
    LIMIT p_limit
  )
  SELECT
    typ AS item_type,
    id  AS item_id,
    eid AS entity_id,
    created_at,
    score AS rank,
    jsonb_build_object('type', typ, 'id', id) AS payload,
    anchors.next_ts  AS next_cursor_ts,
    anchors.next_id  AS next_cursor_id
  FROM page, anchors;
END $$;

-- Drop and recreate feed_fusion_profile with cursor + consistent columns
DROP FUNCTION IF EXISTS public.feed_fusion_profile(uuid, text, timestamptz, uuid, int);

CREATE OR REPLACE FUNCTION public.feed_fusion_profile(
  p_entity_id uuid,
  p_mode      text DEFAULT 'this_page',
  p_cursor_ts timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit     int  DEFAULT 30
)
RETURNS TABLE(
  item_type text, item_id uuid, entity_id uuid, created_at timestamptz,
  rank numeric, payload jsonb, next_cursor_ts timestamptz, next_cursor_id uuid
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT check_rate_limit('feed_fusion_profile:'||p_entity_id::text, 120, 60) THEN
    RAISE EXCEPTION 'Rate limit' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  WITH posts_src AS (
    SELECT 'post'::text typ, p.id, p.entity_id eid, p.created_at,
           exp( - (EXTRACT(epoch FROM (now()-p.created_at))/3600.0) / 48.0 ) AS score
    FROM posts p
    JOIN post_targets pt ON pt.post_id=p.id AND pt.approved=true AND pt.target_entity_id = p_entity_id
    LEFT JOIN feed_hides fh ON fh.user_id = auth.uid() AND fh.item_type='reel' AND fh.item_id = p.id
    WHERE fh.item_id IS NULL
      AND (p_cursor_ts IS NULL OR p.created_at < p_cursor_ts OR (p.created_at = p_cursor_ts AND p.id < p_cursor_id))
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT p_limit
  ),
  listings_src AS (
    SELECT 'listing'::text typ, l.id, l.seller_entity_id eid, l.created_at,
           exp( - (EXTRACT(epoch FROM (now()-l.created_at))/3600.0) / 48.0 ) AS score
    FROM marketplace_listings l
    LEFT JOIN feed_hides fh ON fh.user_id = auth.uid() AND fh.item_type='listing' AND fh.item_id = l.id
    WHERE l.seller_entity_id = p_entity_id AND l.status='active'
      AND fh.item_id IS NULL
      AND (p_cursor_ts IS NULL OR l.created_at < p_cursor_ts OR (l.created_at = p_cursor_ts AND l.id < p_cursor_id))
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT p_limit
  ),
  events_src AS (
    SELECT 'event'::text typ, e.id, e.host_entity_id eid, e.starts_at AS created_at,
           exp( - (EXTRACT(epoch FROM (now()-e.starts_at))/3600.0) / 48.0 ) AS score
    FROM events e
    LEFT JOIN feed_hides fh ON fh.user_id = auth.uid() AND fh.item_type='event' AND fh.item_id = e.id
    WHERE e.host_entity_id = p_entity_id AND e.starts_at > now()
      AND fh.item_id IS NULL
      AND (p_cursor_ts IS NULL OR e.starts_at < p_cursor_ts OR (e.starts_at = p_cursor_ts AND e.id < p_cursor_id))
    ORDER BY e.starts_at DESC, e.id DESC
    LIMIT p_limit
  ),
  combined AS (
    SELECT * FROM posts_src
    UNION ALL SELECT * FROM listings_src
    UNION ALL SELECT * FROM events_src
  ),
  page_plus_one AS (
    SELECT * FROM combined ORDER BY created_at DESC, id DESC LIMIT p_limit + 1
  ),
  anchors AS (
    SELECT
      CASE WHEN COUNT(*) > p_limit THEN true ELSE false END AS has_more,
      (ARRAY_AGG(created_at ORDER BY created_at DESC, id DESC))[p_limit+1] AS next_ts,
      (ARRAY_AGG(id         ORDER BY created_at DESC, id DESC))[p_limit+1] AS next_id
    FROM page_plus_one
  ),
  page AS (
    SELECT * FROM page_plus_one ORDER BY created_at DESC, id DESC LIMIT p_limit
  )
  SELECT
    typ AS item_type,
    id  AS item_id,
    eid AS entity_id,
    created_at,
    score AS rank,
    jsonb_build_object('type', typ, 'id', id) AS payload,
    anchors.next_ts  AS next_cursor_ts,
    anchors.next_id  AS next_cursor_id
  FROM page, anchors;
END $$;

-- Update rocker_next_best_actions with search_path
DROP FUNCTION IF EXISTS public.rocker_next_best_actions(uuid);

CREATE OR REPLACE FUNCTION public.rocker_next_best_actions(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actions jsonb := '[]'::jsonb;
  v_listings_count int;
  v_posts_30d int;
  v_events_upcoming int;
  v_profile_complete boolean;
  v_recent_activity_days int;
BEGIN
  IF NOT check_rate_limit('nba:'||p_user_id::text, 60, 60) THEN
    RAISE EXCEPTION 'Rate limit' USING ERRCODE='42501';
  END IF;

  SELECT COUNT(*) INTO v_listings_count FROM marketplace_listings WHERE seller_entity_id IN (
    SELECT id FROM entities WHERE owner_user_id = p_user_id
  ) AND status='active';

  SELECT COUNT(*) INTO v_posts_30d FROM posts WHERE author_user_id = p_user_id AND created_at > now() - interval '30 days';
  SELECT COUNT(*) INTO v_events_upcoming FROM events WHERE host_entity_id IN (SELECT id FROM entities WHERE owner_user_id=p_user_id) AND starts_at > now();

  SELECT (display_name IS NOT NULL AND avatar_url IS NOT NULL AND bio IS NOT NULL)
    INTO v_profile_complete FROM profiles WHERE user_id = p_user_id;

  SELECT EXTRACT(days FROM (now() - MAX(created_at)))::int INTO v_recent_activity_days FROM posts WHERE author_user_id = p_user_id;

  IF v_listings_count = 0 THEN
    actions := actions || jsonb_build_object('action','create_listing','why','No active listings yet','cta','List Your First Item','href','/dashboard?m=listings&task=new','weight',0.85);
  END IF;

  IF NOT COALESCE(v_profile_complete,false) THEN
    actions := actions || jsonb_build_object('action','complete_profile','why','Profile incomplete','cta','Complete Your Profile','href','/settings/profile','weight',0.90);
  END IF;

  IF v_posts_30d = 0 THEN
    actions := actions || jsonb_build_object('action','create_post','why','Share your first update','cta','Create a Post','href','/compose','weight',0.75);
  END IF;

  IF v_events_upcoming = 0 THEN
    actions := actions || jsonb_build_object('action','create_event','why','No upcoming events','cta','Host an Event','href','/events/new','weight',0.70);
  END IF;

  IF COALESCE(v_recent_activity_days,999) > 7 THEN
    actions := actions || jsonb_build_object('action','engage','why','No activity in '||v_recent_activity_days||' days','cta','Catch Up on Feed','href','/','weight',0.80);
  END IF;

  RETURN (SELECT jsonb_agg(a ORDER BY (a->>'weight')::numeric DESC)
          FROM (SELECT jsonb_array_elements(actions) AS a LIMIT 5) s);
END $$;