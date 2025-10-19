-- Marketplace suggestions (fixed to match actual marketplace_listings schema)

CREATE OR REPLACE FUNCTION public.marketplace_suggestions_for_user(
  p_user_id uuid, 
  p_limit int DEFAULT 24
)
RETURNS TABLE(
  interest_id uuid,
  category_id uuid,
  source text,
  title text,
  url text,
  price_cents int,
  currency text,
  image_url text,
  score numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$
WITH u AS (
  SELECT ui.interest_id, ui.affinity
  FROM public.user_interests ui
  WHERE ui.user_id = p_user_id
),
m AS (
  SELECT im.interest_id, im.category_id, mc.category as category_text
  FROM public.marketplace_interest_map im
  JOIN public.marketplace_categories mc ON mc.id = im.category_id
  JOIN u ON u.interest_id = im.interest_id
),
internal AS (
  SELECT 
    m.interest_id, 
    m.category_id,
    'internal'::text as source,
    l.title, 
    null::text as url,
    l.price_cents, 
    'USD'::text as currency,
    (l.media->>0)::text as image_url,
    (0.7 + 0.3 * u.affinity)::numeric as score
  FROM public.marketplace_listings l
  JOIN m ON m.category_text = l.category
  JOIN u ON u.interest_id = m.interest_id
  WHERE l.status = 'active'
),
cand AS (
  SELECT 
    c.interest_id, 
    c.category_id, 
    c.source,
    c.title, 
    c.url, 
    c.price_cents, 
    c.currency, 
    c.image_url,
    (c.score + 0.2)::numeric as score
  FROM public.marketplace_candidates c
  JOIN m ON m.category_id = c.category_id
)
SELECT * FROM internal
UNION ALL
SELECT * FROM cand
ORDER BY score DESC
LIMIT p_limit;
$$;