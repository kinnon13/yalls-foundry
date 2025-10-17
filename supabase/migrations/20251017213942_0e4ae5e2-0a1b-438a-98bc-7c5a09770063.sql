-- P0.3: Reposts with Attribution Chain
-- Complete repost system with attribution tracking and profile tab

CREATE TABLE public.reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  repost_post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  caption TEXT,
  targets UUID[] DEFAULT '{}', -- Target entity IDs for cross-posting
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_post_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_reposts_user_created ON public.reposts(user_id, created_at DESC, id DESC);
CREATE INDEX idx_reposts_source ON public.reposts(source_post_id);
CREATE INDEX idx_reposts_repost ON public.reposts(repost_post_id);

-- Enable RLS
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reposts they have access to"
  ON public.reposts FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = source_post_id
        AND (p.visibility = 'public' OR p.author_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create their own reposts"
  ON public.reposts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reposts"
  ON public.reposts FOR DELETE
  USING (auth.uid() = user_id);

-- Enhanced post_repost RPC with full attribution chain
CREATE OR REPLACE FUNCTION public.post_repost(
  p_source_post_id UUID,
  p_caption TEXT DEFAULT NULL,
  p_target_entity_ids UUID[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_post_id UUID;
  v_source_post RECORD;
  v_target_id UUID;
  v_repost_id UUID;
BEGIN
  -- Get source post details
  SELECT * INTO v_source_post
  FROM public.posts
  WHERE id = p_source_post_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source post not found';
  END IF;

  -- Verify user can see source post
  IF v_source_post.visibility = 'private' AND v_source_post.author_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied to source post';
  END IF;

  -- Create new post (the repost)
  INSERT INTO public.posts (
    author_user_id,
    body,
    media,
    visibility,
    tenant_id
  ) VALUES (
    auth.uid(),
    COALESCE(p_caption, v_source_post.body),
    v_source_post.media,
    'public',
    auth.uid()
  ) RETURNING id INTO v_new_post_id;

  -- Record repost relationship
  INSERT INTO public.reposts (
    user_id,
    source_post_id,
    repost_post_id,
    caption,
    targets
  ) VALUES (
    auth.uid(),
    p_source_post_id,
    v_new_post_id,
    p_caption,
    p_target_entity_ids
  ) RETURNING id INTO v_repost_id;

  -- Add target entities for cross-posting
  IF array_length(p_target_entity_ids, 1) > 0 THEN
    FOREACH v_target_id IN ARRAY p_target_entity_ids LOOP
      INSERT INTO public.post_targets (
        post_id,
        target_entity_id,
        source_post_id,
        reason,
        approved
      ) VALUES (
        v_new_post_id,
        v_target_id,
        p_source_post_id,
        'repost',
        true -- User-initiated reposts are pre-approved
      ) ON CONFLICT (post_id, target_entity_id) DO NOTHING;
    END LOOP;
  END IF;

  -- Log action
  INSERT INTO public.ai_action_ledger (user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'post_repost',
    jsonb_build_object(
      'source_post_id', p_source_post_id,
      'target_count', COALESCE(array_length(p_target_entity_ids, 1), 0)
    ),
    jsonb_build_object('repost_id', v_new_post_id),
    'success'
  );

  RETURN v_new_post_id;
END;
$$;

-- RPC: Get user's reposts with attribution chain
CREATE OR REPLACE FUNCTION public.reposts_list(
  p_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  repost_id UUID,
  repost_post_id UUID,
  source_post_id UUID,
  caption TEXT,
  created_at TIMESTAMPTZ,
  source_author_id UUID,
  source_body TEXT,
  repost_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user UUID;
BEGIN
  v_target_user := COALESCE(p_user_id, auth.uid());

  RETURN QUERY
  SELECT 
    r.id as repost_id,
    r.repost_post_id,
    r.source_post_id,
    r.caption,
    r.created_at,
    p.author_user_id as source_author_id,
    p.body as source_body,
    (SELECT COUNT(*)::INT FROM public.reposts WHERE source_post_id = r.source_post_id) as repost_count
  FROM public.reposts r
  JOIN public.posts p ON p.id = r.source_post_id
  WHERE r.user_id = v_target_user
  ORDER BY r.created_at DESC, r.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- RPC: Get attribution chain for a post (who reposted from whom)
CREATE OR REPLACE FUNCTION public.post_attribution_chain(p_post_id UUID)
RETURNS TABLE(
  level INT,
  post_id UUID,
  author_id UUID,
  created_at TIMESTAMPTZ,
  repost_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE chain AS (
    -- Base: the original post
    SELECT 
      0 as level,
      p.id as post_id,
      p.author_user_id as author_id,
      p.created_at,
      (SELECT COUNT(*)::INT FROM public.reposts WHERE source_post_id = p.id) as repost_count
    FROM public.posts p
    WHERE p.id = p_post_id

    UNION ALL

    -- Recursive: follow repost chain backwards
    SELECT 
      c.level + 1,
      p.id,
      p.author_user_id,
      p.created_at,
      (SELECT COUNT(*)::INT FROM public.reposts WHERE source_post_id = p.id)
    FROM chain c
    JOIN public.reposts r ON r.repost_post_id = c.post_id
    JOIN public.posts p ON p.id = r.source_post_id
    WHERE c.level < 10 -- Prevent infinite loops
  )
  SELECT * FROM chain ORDER BY level DESC;
END;
$$;