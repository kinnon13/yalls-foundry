-- Posts table (core feed content)
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  author_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('text','image','video','link')),
  body text,
  media jsonb DEFAULT '[]'::jsonb,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Saves (bookmarks)
CREATE TABLE IF NOT EXISTS public.post_saves (
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  collection text DEFAULT 'All',
  note text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id, post_id)
);

-- Re-shares (with optional commentary)
CREATE TABLE IF NOT EXISTS public.post_reshares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  commentary text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  created_at timestamptz DEFAULT now()
);

-- User shortcuts for Rocker's quick recall
CREATE TABLE IF NOT EXISTS public.user_shortcuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  shortcut text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('post','profile','horse')),
  target_id uuid NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(tenant_id, author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(tenant_id, visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_saves_user ON public.post_saves(tenant_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reshares_user ON public.post_reshares(tenant_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_shortcuts_user ON public.user_shortcuts(tenant_id, user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reshares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shortcuts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Public posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view their own posts"
  ON public.posts FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id);

-- RLS Policies for saves
CREATE POLICY "Users can manage their own saves"
  ON public.post_saves FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for reshares
CREATE POLICY "Users can view public reshares"
  ON public.post_reshares FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view their own reshares"
  ON public.post_reshares FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reshares"
  ON public.post_reshares FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own reshares"
  ON public.post_reshares FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for shortcuts
CREATE POLICY "Users can manage their own shortcuts"
  ON public.user_shortcuts FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );