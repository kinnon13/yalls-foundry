-- Add live streams table
CREATE TABLE IF NOT EXISTS public.live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  streamer_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  stream_url text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('offline','live','ended')),
  viewer_count integer DEFAULT 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_streams
CREATE POLICY "Live streams are viewable by everyone"
  ON public.live_streams FOR SELECT
  USING (true);

CREATE POLICY "Streamers can create their streams"
  ON public.live_streams FOR INSERT
  WITH CHECK (auth.uid() = streamer_id);

CREATE POLICY "Streamers can update their streams"
  ON public.live_streams FOR UPDATE
  USING (auth.uid() = streamer_id);

CREATE POLICY "Streamers can delete their streams"
  ON public.live_streams FOR DELETE
  USING (auth.uid() = streamer_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON public.live_streams(tenant_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_streams_streamer ON public.live_streams(tenant_id, streamer_id, created_at DESC);