-- User feed preferences for personalized layout
CREATE TABLE IF NOT EXISTS public.user_feed_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Feed layout preference
  feed_layout TEXT NOT NULL DEFAULT 'auto' CHECK (feed_layout IN ('auto', 'tiktok', 'instagram', 'facebook')),
  
  -- Content filtering preferences
  hidden_users UUID[] DEFAULT '{}',
  hidden_topics TEXT[] DEFAULT '{}',
  boosted_users UUID[] DEFAULT '{}',
  boosted_topics TEXT[] DEFAULT '{}',
  
  -- Interaction tracking for auto-detection
  tiktok_interactions INTEGER DEFAULT 0,
  instagram_interactions INTEGER DEFAULT 0,
  facebook_interactions INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.user_feed_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can manage own feed preferences"
  ON public.user_feed_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all preferences
CREATE POLICY "Admins can view all preferences"
  ON public.user_feed_preferences
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER update_user_feed_preferences_updated_at
  BEFORE UPDATE ON public.user_feed_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for performance
CREATE INDEX idx_user_feed_preferences_user ON public.user_feed_preferences(user_id);
CREATE INDEX idx_user_feed_preferences_tenant ON public.user_feed_preferences(tenant_id);