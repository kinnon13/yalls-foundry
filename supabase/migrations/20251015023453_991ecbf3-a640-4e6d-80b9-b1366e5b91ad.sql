-- Media management tables for Rocker upload system

-- Media files table
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  file_name TEXT NOT NULL,
  file_size INTEGER,
  caption TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ai_analysis JSONB,
  linked_entities JSONB DEFAULT '[]'::jsonb,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'team')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Media to entity links (many-to-many)
CREATE TABLE public.media_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('horse', 'profile', 'business', 'event')),
  entity_id UUID NOT NULL,
  relation_type TEXT DEFAULT 'tagged',
  confidence NUMERIC(3,2) DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(media_id, entity_type, entity_id)
);

-- Horse feed (posts/updates for horses)
CREATE TABLE public.horse_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  horse_id UUID NOT NULL,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  post_type TEXT DEFAULT 'photo' CHECK (post_type IN ('photo', 'video', 'update', 'result', 'sale')),
  caption TEXT,
  tagged_profiles JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_media_user ON public.media(user_id);
CREATE INDEX idx_media_tenant ON public.media(tenant_id);
CREATE INDEX idx_media_type ON public.media(file_type);
CREATE INDEX idx_media_created ON public.media(created_at DESC);

CREATE INDEX idx_media_entities_media ON public.media_entities(media_id);
CREATE INDEX idx_media_entities_entity ON public.media_entities(entity_type, entity_id);

CREATE INDEX idx_horse_feed_horse ON public.horse_feed(horse_id);
CREATE INDEX idx_horse_feed_created ON public.horse_feed(created_at DESC);

-- RLS Policies
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horse_feed ENABLE ROW LEVEL SECURITY;

-- Media policies
CREATE POLICY "Users can view their own media"
  ON public.media FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public media"
  ON public.media FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can insert their own media"
  ON public.media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media"
  ON public.media FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
  ON public.media FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all media"
  ON public.media FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Media entities policies
CREATE POLICY "Users can view media entities for their media"
  ON public.media_entities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.media
    WHERE media.id = media_entities.media_id
    AND (media.user_id = auth.uid() OR media.visibility = 'public')
  ));

CREATE POLICY "Users can manage entities for their media"
  ON public.media_entities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.media
    WHERE media.id = media_entities.media_id
    AND media.user_id = auth.uid()
  ));

-- Horse feed policies
CREATE POLICY "Anyone can view public horse feed"
  ON public.horse_feed FOR SELECT
  USING (true);

CREATE POLICY "Users can insert horse feed"
  ON public.horse_feed FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own horse feed"
  ON public.horse_feed FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own horse feed"
  ON public.horse_feed FOR DELETE
  USING (auth.uid() = created_by);

-- Function to update media timestamps
CREATE OR REPLACE FUNCTION update_media_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_timestamp
  BEFORE UPDATE ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION update_media_timestamp();

CREATE TRIGGER update_horse_feed_timestamp
  BEFORE UPDATE ON public.horse_feed
  FOR EACH ROW
  EXECUTE FUNCTION update_media_timestamp();