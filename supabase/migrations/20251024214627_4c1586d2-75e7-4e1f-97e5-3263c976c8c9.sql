-- Yalls Social: Feed Posts, Likes, and Cart Integration
-- Role: Database schema for viral social feeds with embedded shopping

-- Create yalls_social_posts table
CREATE TABLE IF NOT EXISTS public.yalls_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  viral_score DOUBLE PRECISION DEFAULT 0,
  product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create yalls_social_likes table
CREATE TABLE IF NOT EXISTS public.yalls_social_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.yalls_social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create yallmart_cart_items table (for embedded shopping)
CREATE TABLE IF NOT EXISTS public.yallmart_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  source_post_id UUID REFERENCES public.yalls_social_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.yalls_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yalls_social_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yallmart_cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for yalls_social_posts
CREATE POLICY "Anyone can view posts"
  ON public.yalls_social_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own posts"
  ON public.yalls_social_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.yalls_social_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.yalls_social_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for yalls_social_likes
CREATE POLICY "Anyone can view likes"
  ON public.yalls_social_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.yalls_social_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.yalls_social_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for yallmart_cart_items
CREATE POLICY "Users can view their own cart"
  ON public.yallmart_cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their cart"
  ON public.yallmart_cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their cart"
  ON public.yallmart_cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their cart"
  ON public.yallmart_cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_social_posts_user ON public.yalls_social_posts(user_id);
CREATE INDEX idx_social_posts_viral_score ON public.yalls_social_posts(viral_score DESC);
CREATE INDEX idx_social_posts_created ON public.yalls_social_posts(created_at DESC);
CREATE INDEX idx_social_likes_post ON public.yalls_social_likes(post_id);
CREATE INDEX idx_social_likes_user ON public.yalls_social_likes(user_id);
CREATE INDEX idx_cart_items_user ON public.yallmart_cart_items(user_id);

-- Function to increment post likes atomically
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.yalls_social_posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to boost viral score (paid feature stub)
CREATE OR REPLACE FUNCTION boost_post_viral_score(post_id UUID, boost_multiplier DOUBLE PRECISION)
RETURNS VOID AS $$
BEGIN
  UPDATE public.yalls_social_posts
  SET viral_score = viral_score * boost_multiplier
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_social_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.yalls_social_posts
  FOR EACH ROW EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.yallmart_cart_items
  FOR EACH ROW EXECUTE FUNCTION update_social_updated_at();