-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_user_id UUID NOT NULL,
  followee_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_user_id, followee_user_id),
  CHECK (follower_user_id != followee_user_id)
);

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Users can view their own follows
CREATE POLICY "Users can view their own follows"
ON public.follows
FOR SELECT
USING (auth.uid() = follower_user_id OR auth.uid() = followee_user_id);

-- Users can follow others
CREATE POLICY "Users can follow others"
ON public.follows
FOR INSERT
WITH CHECK (auth.uid() = follower_user_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
ON public.follows
FOR DELETE
USING (auth.uid() = follower_user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON public.follows(followee_user_id);