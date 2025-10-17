-- PR5c: Usage Events + Feed Indexes (fixed immutable issue)

-- Usage events table for telemetry
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'play', 'click', 'add_to_cart', 'rsvp', 'dwell', 'like', 'repost', 'share')),
  item_type TEXT NOT NULL CHECK (item_type IN ('post', 'listing', 'event')),
  item_id UUID NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for usage_events
CREATE INDEX IF NOT EXISTS idx_usage_events_user_created ON public.usage_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_session ON public.usage_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_item ON public.usage_events(item_type, item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON public.usage_events(event_type, created_at DESC);

-- Feed optimization indexes
CREATE INDEX IF NOT EXISTS idx_post_targets_approved ON public.post_targets(target_entity_id, approved, created_at DESC) WHERE approved = true;
CREATE INDEX IF NOT EXISTS idx_posts_body_tsv ON public.posts USING GIN(to_tsvector('english', body));
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_status ON public.marketplace_listings(seller_profile_id, status, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_events_host_starts ON public.events(host_profile_id, starts_at);

-- RLS for usage_events
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
ON public.usage_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert events"
ON public.usage_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all events"
ON public.usage_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));