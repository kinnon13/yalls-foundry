-- Create dynamic_categories table for marketplace
CREATE TABLE public.dynamic_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES public.dynamic_categories(id) ON DELETE CASCADE,
  is_ai_suggested BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Enable RLS
ALTER TABLE public.dynamic_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view categories
CREATE POLICY "Categories are viewable by everyone"
  ON public.dynamic_categories
  FOR SELECT
  USING (true);

-- Authenticated users can suggest categories (marked as AI-suggested)
CREATE POLICY "Authenticated users can suggest categories"
  ON public.dynamic_categories
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND is_ai_suggested = true
  );

-- Admins can manage all categories
CREATE POLICY "Admins can manage categories"
  ON public.dynamic_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- Create indexes
CREATE INDEX idx_dynamic_categories_parent ON public.dynamic_categories(parent_category_id);
CREATE INDEX idx_dynamic_categories_slug ON public.dynamic_categories(slug);
CREATE INDEX idx_dynamic_categories_usage ON public.dynamic_categories(usage_count DESC);

-- Insert initial marketplace categories
INSERT INTO public.dynamic_categories (slug, name, description, parent_category_id, is_ai_suggested) VALUES
  -- Top-level categories
  ('agriculture', 'Agriculture', 'Farm equipment, supplies, and services', NULL, false),
  ('horse-world', 'Horse World', 'Equestrian products and services', NULL, false),
  ('livestock', 'Livestock', 'Livestock and animal care', NULL, false),
  ('equipment', 'Equipment & Machinery', 'Heavy equipment and tools', NULL, false),
  ('supplies', 'Supplies & Materials', 'General farm and ranch supplies', NULL, false),
  ('services', 'Services', 'Professional services', NULL, false);

-- Agriculture subcategories
INSERT INTO public.dynamic_categories (slug, name, description, parent_category_id, is_ai_suggested)
SELECT 
  'seeds-plants', 'Seeds & Plants', 'Seeds, seedlings, and plants', id, false
FROM public.dynamic_categories WHERE slug = 'agriculture'
UNION ALL
SELECT 
  'fertilizers', 'Fertilizers & Soil', 'Fertilizers, compost, and soil amendments', id, false
FROM public.dynamic_categories WHERE slug = 'agriculture'
UNION ALL
SELECT 
  'crop-protection', 'Crop Protection', 'Pesticides, herbicides, and fungicides', id, false
FROM public.dynamic_categories WHERE slug = 'agriculture'
UNION ALL
SELECT 
  'irrigation', 'Irrigation Systems', 'Water pumps, pipes, and sprinklers', id, false
FROM public.dynamic_categories WHERE slug = 'agriculture';

-- Horse World subcategories
INSERT INTO public.dynamic_categories (slug, name, description, parent_category_id, is_ai_suggested)
SELECT 
  'tack-equipment', 'Tack & Equipment', 'Saddles, bridles, and riding gear', id, false
FROM public.dynamic_categories WHERE slug = 'horse-world'
UNION ALL
SELECT 
  'horse-care', 'Horse Care Products', 'Grooming, health, and nutrition', id, false
FROM public.dynamic_categories WHERE slug = 'horse-world'
UNION ALL
SELECT 
  'riding-apparel', 'Riding Apparel', 'Boots, helmets, and riding clothes', id, false
FROM public.dynamic_categories WHERE slug = 'horse-world'
UNION ALL
SELECT 
  'stable-supplies', 'Stable Supplies', 'Bedding, feeders, and stall equipment', id, false
FROM public.dynamic_categories WHERE slug = 'horse-world';

-- Livestock subcategories
INSERT INTO public.dynamic_categories (slug, name, description, parent_category_id, is_ai_suggested)
SELECT 
  'cattle', 'Cattle', 'Cattle equipment and supplies', id, false
FROM public.dynamic_categories WHERE slug = 'livestock'
UNION ALL
SELECT 
  'poultry', 'Poultry', 'Chicken coops, feeders, and supplies', id, false
FROM public.dynamic_categories WHERE slug = 'livestock'
UNION ALL
SELECT 
  'sheep-goats', 'Sheep & Goats', 'Small livestock equipment', id, false
FROM public.dynamic_categories WHERE slug = 'livestock'
UNION ALL
SELECT 
  'animal-health', 'Animal Health', 'Veterinary supplies and medications', id, false
FROM public.dynamic_categories WHERE slug = 'livestock';

-- Equipment subcategories
INSERT INTO public.dynamic_categories (slug, name, description, parent_category_id, is_ai_suggested)
SELECT 
  'tractors', 'Tractors', 'New and used tractors', id, false
FROM public.dynamic_categories WHERE slug = 'equipment'
UNION ALL
SELECT 
  'implements', 'Implements & Attachments', 'Plows, harrows, and accessories', id, false
FROM public.dynamic_categories WHERE slug = 'equipment'
UNION ALL
SELECT 
  'hand-tools', 'Hand Tools', 'Shovels, rakes, and manual tools', id, false
FROM public.dynamic_categories WHERE slug = 'equipment'
UNION ALL
SELECT 
  'power-tools', 'Power Tools', 'Drills, saws, and motorized tools', id, false
FROM public.dynamic_categories WHERE slug = 'equipment';

-- Supplies subcategories
INSERT INTO public.dynamic_categories (slug, name, description, parent_category_id, is_ai_suggested)
SELECT 
  'fencing', 'Fencing & Gates', 'Wire, posts, and gate hardware', id, false
FROM public.dynamic_categories WHERE slug = 'supplies'
UNION ALL
SELECT 
  'feed-hay', 'Feed & Hay', 'Animal feed and forage', id, false
FROM public.dynamic_categories WHERE slug = 'supplies'
UNION ALL
SELECT 
  'building-materials', 'Building Materials', 'Lumber, roofing, and construction supplies', id, false
FROM public.dynamic_categories WHERE slug = 'supplies'
UNION ALL
SELECT 
  'safety-gear', 'Safety Gear', 'Personal protective equipment', id, false
FROM public.dynamic_categories WHERE slug = 'supplies';

-- Services subcategories
INSERT INTO public.dynamic_categories (slug, name, description, parent_category_id, is_ai_suggested)
SELECT 
  'training', 'Training & Education', 'Workshops, courses, and coaching', id, false
FROM public.dynamic_categories WHERE slug = 'services'
UNION ALL
SELECT 
  'veterinary', 'Veterinary Services', 'Animal healthcare professionals', id, false
FROM public.dynamic_categories WHERE slug = 'services'
UNION ALL
SELECT 
  'consulting', 'Consulting', 'Farm management and advisory services', id, false
FROM public.dynamic_categories WHERE slug = 'services'
UNION ALL
SELECT 
  'hauling', 'Hauling & Transport', 'Livestock and equipment transport', id, false
FROM public.dynamic_categories WHERE slug = 'services';