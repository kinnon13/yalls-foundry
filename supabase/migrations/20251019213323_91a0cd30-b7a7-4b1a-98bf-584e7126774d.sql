-- Universal Interests System
-- Creates domain → category → tag taxonomy with weighted user/entity connections

-- 1) Interest Catalog (universal taxonomy)
CREATE TABLE IF NOT EXISTS public.interest_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  category text NOT NULL,
  tag text NOT NULL,
  locale text NOT NULL DEFAULT 'en-US',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(domain, category, tag, locale)
);

CREATE INDEX IF NOT EXISTS idx_interest_catalog_domain ON public.interest_catalog(domain);
CREATE INDEX IF NOT EXISTS idx_interest_catalog_category ON public.interest_catalog(category);
CREATE INDEX IF NOT EXISTS idx_interest_catalog_search ON public.interest_catalog USING gin(to_tsvector('english', domain || ' ' || category || ' ' || tag));

-- 2) User Interests (weighted connections)
CREATE TABLE IF NOT EXISTS public.user_interests (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id uuid NOT NULL REFERENCES public.interest_catalog(id) ON DELETE CASCADE,
  affinity numeric(3,2) NOT NULL DEFAULT 0.80 CHECK (affinity >= 0.00 AND affinity <= 1.00),
  confidence text NOT NULL DEFAULT 'explicit' CHECK (confidence IN ('explicit', 'inferred')),
  source text NOT NULL DEFAULT 'onboarding',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_affinity ON public.user_interests(user_id, affinity DESC);

-- 3) Entity Interests (for profiles, listings, events)
CREATE TABLE IF NOT EXISTS public.entity_interests (
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  interest_id uuid NOT NULL REFERENCES public.interest_catalog(id) ON DELETE CASCADE,
  relevance numeric(3,2) NOT NULL DEFAULT 0.90 CHECK (relevance >= 0.00 AND relevance <= 1.00),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_interests_entity ON public.entity_interests(entity_id);

-- RLS Policies
ALTER TABLE public.interest_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog_public_read" ON public.interest_catalog FOR SELECT USING (true);

ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_can_read_own_interests" ON public.user_interests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_can_write_own_interests" ON public.user_interests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_can_update_own_interests" ON public.user_interests FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_can_delete_own_interests" ON public.user_interests FOR DELETE USING (user_id = auth.uid());

ALTER TABLE public.entity_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_interests_public_read" ON public.entity_interests FOR SELECT USING (true);
CREATE POLICY "entity_interests_owner_write" ON public.entity_interests 
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.entities e 
    WHERE e.id = entity_id AND e.owner_user_id = auth.uid()
  ));

-- RPCs
CREATE OR REPLACE FUNCTION public.interest_catalog_search(
  p_q text, 
  p_locale text DEFAULT 'en-US', 
  p_limit int DEFAULT 25
)
RETURNS SETOF interest_catalog
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$
  SELECT *
  FROM public.interest_catalog
  WHERE is_active
    AND locale = p_locale
    AND (domain ILIKE '%'||p_q||'%' OR category ILIKE '%'||p_q||'%' OR tag ILIKE '%'||p_q||'%')
  ORDER BY domain, category, sort_order, tag
  LIMIT p_limit
$$;

CREATE OR REPLACE FUNCTION public.interest_catalog_browse(
  p_domain text DEFAULT NULL,
  p_locale text DEFAULT 'en-US',
  p_limit int DEFAULT 100
)
RETURNS SETOF interest_catalog
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$
  SELECT *
  FROM public.interest_catalog
  WHERE is_active
    AND locale = p_locale
    AND (p_domain IS NULL OR domain = p_domain)
  ORDER BY domain, category, sort_order, tag
  LIMIT p_limit
$$;

CREATE OR REPLACE FUNCTION public.user_interests_upsert(p_items jsonb)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE 
  r jsonb; 
  v_cnt int := 0;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.user_interests(user_id, interest_id, affinity, confidence, source)
    VALUES (
      auth.uid(),
      (r->>'interest_id')::uuid,
      COALESCE((r->>'affinity')::numeric, 0.80),
      COALESCE(r->>'confidence','explicit'),
      COALESCE(r->>'source','onboarding')
    )
    ON CONFLICT (user_id, interest_id)
    DO UPDATE SET
      affinity = EXCLUDED.affinity,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source,
      updated_at = now();
    v_cnt := v_cnt + 1;
  END LOOP;
  RETURN v_cnt;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_interests_remove(p_interest_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public
AS $$
  DELETE FROM public.user_interests 
  WHERE user_id = auth.uid() AND interest_id = p_interest_id;
$$;

-- Seed comprehensive taxonomy
INSERT INTO public.interest_catalog(domain, category, tag, sort_order) VALUES
-- Sports & Fitness: Equestrian
('Sports & Fitness', 'Equestrian', 'Barrel Racing', 1),
('Sports & Fitness', 'Equestrian', 'Reining', 2),
('Sports & Fitness', 'Equestrian', 'Cutting', 3),
('Sports & Fitness', 'Equestrian', 'Hunter/Jumper', 4),
('Sports & Fitness', 'Equestrian', 'Dressage', 5),
('Sports & Fitness', 'Equestrian', 'Rodeo', 6),
('Sports & Fitness', 'Equestrian', 'Trail Riding', 7),
('Sports & Fitness', 'Equestrian', 'Breeding', 8),
('Sports & Fitness', 'Equestrian', 'Horse Care', 9),
('Sports & Fitness', 'Equestrian', 'Tack & Gear', 10),

-- Sports & Fitness: Ball Sports
('Sports & Fitness', 'Ball Sports', 'Basketball (NBA/WNBA)', 1),
('Sports & Fitness', 'Ball Sports', 'Football (NFL/CFB)', 2),
('Sports & Fitness', 'Ball Sports', 'Soccer (EPL/MLS/UCL)', 3),
('Sports & Fitness', 'Ball Sports', 'Baseball', 4),
('Sports & Fitness', 'Ball Sports', 'Volleyball', 5),
('Sports & Fitness', 'Ball Sports', 'Tennis', 6),
('Sports & Fitness', 'Ball Sports', 'Pickleball', 7),

-- Sports & Fitness: Endurance & Outdoor
('Sports & Fitness', 'Endurance & Outdoor', 'Running', 1),
('Sports & Fitness', 'Endurance & Outdoor', 'Cycling (Road/MTB/Gravel)', 2),
('Sports & Fitness', 'Endurance & Outdoor', 'Triathlon', 3),
('Sports & Fitness', 'Endurance & Outdoor', 'Hiking', 4),
('Sports & Fitness', 'Endurance & Outdoor', 'Climbing', 5),
('Sports & Fitness', 'Endurance & Outdoor', 'Camping', 6),
('Sports & Fitness', 'Endurance & Outdoor', 'Fishing', 7),
('Sports & Fitness', 'Endurance & Outdoor', 'Hunting', 8),

-- Sports & Fitness: Strength & Wellness
('Sports & Fitness', 'Strength & Wellness', 'Gym/Strength', 1),
('Sports & Fitness', 'Strength & Wellness', 'CrossFit', 2),
('Sports & Fitness', 'Strength & Wellness', 'Yoga', 3),
('Sports & Fitness', 'Strength & Wellness', 'Pilates', 4),
('Sports & Fitness', 'Strength & Wellness', 'Mobility', 5),
('Sports & Fitness', 'Strength & Wellness', 'Nutrition', 6),
('Sports & Fitness', 'Strength & Wellness', 'Recovery', 7),

-- Tech & Making: AI/ML
('Tech & Making', 'AI/ML', 'LLMs', 1),
('Tech & Making', 'AI/ML', 'Agents', 2),
('Tech & Making', 'AI/ML', 'Prompting', 3),
('Tech & Making', 'AI/ML', 'Vision', 4),
('Tech & Making', 'AI/ML', 'Open-Source Models', 5),
('Tech & Making', 'AI/ML', 'MLOps', 6),

-- Tech & Making: Software
('Tech & Making', 'Software', 'Web Dev', 1),
('Tech & Making', 'Software', 'Mobile', 2),
('Tech & Making', 'Software', 'Cloud', 3),
('Tech & Making', 'Software', 'Security', 4),
('Tech & Making', 'Software', 'Databases', 5),
('Tech & Making', 'Software', 'DevOps', 6),

-- Tech & Making: Hardware/Maker
('Tech & Making', 'Hardware/Maker', '3D Printing', 1),
('Tech & Making', 'Hardware/Maker', 'Drones', 2),
('Tech & Making', 'Hardware/Maker', 'Robotics', 3),
('Tech & Making', 'Hardware/Maker', 'Arduino/RPi', 4),
('Tech & Making', 'Hardware/Maker', 'PC Building', 5),

-- Tech & Making: Crypto/Web3
('Tech & Making', 'Crypto/Web3', 'Bitcoin', 1),
('Tech & Making', 'Crypto/Web3', 'DeFi', 2),
('Tech & Making', 'Crypto/Web3', 'NFTs', 3),
('Tech & Making', 'Crypto/Web3', 'Onchain Gaming', 4),

-- Business & Money: Startups
('Business & Money', 'Startups', 'Fundraising', 1),
('Business & Money', 'Startups', 'Growth', 2),
('Business & Money', 'Startups', 'Product', 3),
('Business & Money', 'Startups', 'Hiring', 4),
('Business & Money', 'Startups', 'GTM', 5),

-- Business & Money: Marketing
('Business & Money', 'Marketing', 'Content', 1),
('Business & Money', 'Marketing', 'Performance', 2),
('Business & Money', 'Marketing', 'SEO', 3),
('Business & Money', 'Marketing', 'Social', 4),
('Business & Money', 'Marketing', 'Affiliate', 5),
('Business & Money', 'Marketing', 'Influencer', 6),
('Business & Money', 'Marketing', 'Email/SMS', 7),

-- Business & Money: Ecommerce
('Business & Money', 'Ecommerce', 'Amazon', 1),
('Business & Money', 'Ecommerce', 'Shopify', 2),
('Business & Money', 'Ecommerce', 'Marketplaces', 3),
('Business & Money', 'Ecommerce', 'Logistics', 4),
('Business & Money', 'Ecommerce', 'Merch', 5),
('Business & Money', 'Ecommerce', 'Pricing', 6),

-- Business & Money: Investing
('Business & Money', 'Investing', 'Stocks', 1),
('Business & Money', 'Investing', 'Options', 2),
('Business & Money', 'Investing', 'Real Estate', 3),
('Business & Money', 'Investing', 'Angel', 4),
('Business & Money', 'Investing', 'Personal Finance', 5),

-- Lifestyle & Culture: Food & Drink
('Lifestyle & Culture', 'Food & Drink', 'Cooking', 1),
('Lifestyle & Culture', 'Food & Drink', 'BBQ/Smoking', 2),
('Lifestyle & Culture', 'Food & Drink', 'Baking', 3),
('Lifestyle & Culture', 'Food & Drink', 'Coffee', 4),
('Lifestyle & Culture', 'Food & Drink', 'Wine', 5),
('Lifestyle & Culture', 'Food & Drink', 'Beer', 6),
('Lifestyle & Culture', 'Food & Drink', 'Cocktails', 7),

-- Lifestyle & Culture: Travel
('Lifestyle & Culture', 'Travel', 'National Parks', 1),
('Lifestyle & Culture', 'Travel', 'Road Trips', 2),
('Lifestyle & Culture', 'Travel', 'International', 3),
('Lifestyle & Culture', 'Travel', 'Budget', 4),
('Lifestyle & Culture', 'Travel', 'Luxury', 5),
('Lifestyle & Culture', 'Travel', 'Vanlife', 6),

-- Lifestyle & Culture: Arts & Media
('Lifestyle & Culture', 'Arts & Media', 'Movies', 1),
('Lifestyle & Culture', 'Arts & Media', 'TV', 2),
('Lifestyle & Culture', 'Arts & Media', 'Anime', 3),
('Lifestyle & Culture', 'Arts & Media', 'Comics', 4),
('Lifestyle & Culture', 'Arts & Media', 'Photography', 5),
('Lifestyle & Culture', 'Arts & Media', 'Design', 6),
('Lifestyle & Culture', 'Arts & Media', 'Music', 7),

-- Lifestyle & Culture: Fashion/Beauty
('Lifestyle & Culture', 'Fashion/Beauty', 'Streetwear', 1),
('Lifestyle & Culture', 'Fashion/Beauty', 'Outdoor Wear', 2),
('Lifestyle & Culture', 'Fashion/Beauty', 'Western', 3),
('Lifestyle & Culture', 'Fashion/Beauty', 'Skincare', 4),
('Lifestyle & Culture', 'Fashion/Beauty', 'Hair', 5),

-- Home & DIY: Home Improvement
('Home & DIY', 'Home Improvement', 'Woodworking', 1),
('Home & DIY', 'Home Improvement', 'Electrical', 2),
('Home & DIY', 'Home Improvement', 'Plumbing', 3),
('Home & DIY', 'Home Improvement', 'Paint', 4),
('Home & DIY', 'Home Improvement', 'Tools', 5),

-- Home & DIY: Garden & Animals
('Home & DIY', 'Garden & Animals', 'Gardening', 1),
('Home & DIY', 'Garden & Animals', 'Houseplants', 2),
('Home & DIY', 'Garden & Animals', 'Beekeeping', 3),
('Home & DIY', 'Garden & Animals', 'Poultry', 4),
('Home & DIY', 'Garden & Animals', 'Dogs', 5),
('Home & DIY', 'Garden & Animals', 'Cats', 6),

-- Home & DIY: Auto/Moto
('Home & DIY', 'Auto/Moto', 'Car Care', 1),
('Home & DIY', 'Auto/Moto', 'Off-road', 2),
('Home & DIY', 'Auto/Moto', 'Motorcycles', 3),
('Home & DIY', 'Auto/Moto', 'EVs', 4),
('Home & DIY', 'Auto/Moto', 'Detailing', 5),

-- Education & Community: Learning
('Education & Community', 'Learning', 'Languages', 1),
('Education & Community', 'Learning', 'Math', 2),
('Education & Community', 'Learning', 'Science', 3),
('Education & Community', 'Learning', 'History', 4),
('Education & Community', 'Learning', 'Writing', 5),
('Education & Community', 'Learning', 'Public Speaking', 6),

-- Education & Community: Causes
('Education & Community', 'Causes', 'Climate', 1),
('Education & Community', 'Causes', 'Animal Welfare', 2),
('Education & Community', 'Causes', 'Veterans', 3),
('Education & Community', 'Causes', 'Local Community', 4)

ON CONFLICT (domain, category, tag, locale) DO NOTHING;