-- PR C1: Taxonomies schema (without marketplace_listings FK)
CREATE TABLE IF NOT EXISTS public.taxonomies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  kind TEXT NOT NULL,
  parent_id UUID REFERENCES taxonomies(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.taxonomy_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_id UUID NOT NULL REFERENCES taxonomies(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(taxonomy_id, value)
);

CREATE TABLE IF NOT EXISTS public.listing_taxonomy (
  listing_id UUID NOT NULL,
  taxonomy_id UUID NOT NULL REFERENCES taxonomies(id) ON DELETE CASCADE,
  value_id UUID NOT NULL REFERENCES taxonomy_values(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, taxonomy_id, value_id)
);

CREATE TABLE IF NOT EXISTS public.saved_items (
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS public.views_coldstart (
  listing_id UUID NOT NULL,
  user_id UUID,
  session_id TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_taxonomy_listing ON listing_taxonomy(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_taxonomy_tax ON listing_taxonomy(taxonomy_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_views_coldstart_listing ON views_coldstart(listing_id);

ALTER TABLE public.taxonomies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.views_coldstart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view taxonomies" ON taxonomies FOR SELECT USING (true);
CREATE POLICY "Everyone can view taxonomy values" ON taxonomy_values FOR SELECT USING (true);
CREATE POLICY "Everyone can view listing taxonomy" ON listing_taxonomy FOR SELECT USING (true);

CREATE POLICY "Users can manage own saved items" ON saved_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can insert views" ON views_coldstart FOR INSERT WITH CHECK (true);