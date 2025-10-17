-- PR-S1 PART 5 (Fixed v3): Fix post_targets RLS and feed fusion (no follows dependency)

-- ========================================
-- 1. ADD RLS POLICIES FOR post_targets  
-- ========================================

-- Admin bypass (admins see all)
CREATE POLICY pt_admin_all ON public.post_targets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ========================================
-- 2. ADD CANONICAL INDEX IF NOT EXISTS
-- ========================================

-- Index for feed fan-out/fan-in on target_entity_id
CREATE INDEX IF NOT EXISTS idx_post_targets_target_entity
  ON public.post_targets(target_entity_id);

-- ========================================
-- 3. UPDATE FEED FUSION FUNCTIONS
-- ========================================

-- Update feed_fusion_home to use canonical target_entity_id (simplified, no follows)
CREATE OR REPLACE FUNCTION public.feed_fusion_home(
  p_profile_id uuid,
  p_lane text,
  p_cursor bigint DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE(
  post_id uuid,
  kind text,
  author_id uuid,
  target_entity_id uuid,
  created_at timestamptz,
  payload jsonb,
  next_cursor bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.id AS post_id,
      p.kind::text,
      COALESCE(p.author_user_id, p.author_id) AS author_id,
      pt.target_entity_id,
      p.created_at,
      jsonb_build_object(
        'body', p.body,
        'media', p.media,
        'author_id', COALESCE(p.author_user_id, p.author_id)
      ) AS payload,
      extract(epoch from p.created_at)::bigint AS seq_id
    FROM posts p
    JOIN post_targets pt ON pt.post_id = p.id
    WHERE pt.approved = true
      AND (p_cursor IS NULL OR extract(epoch from p.created_at)::bigint < p_cursor)
      -- Lane filtering: for now all lanes show all approved posts
      -- Add specific lane logic here when follows/shop tables exist
    ORDER BY p.created_at DESC
    LIMIT p_limit
  )
  SELECT
    post_id, kind, author_id, target_entity_id, created_at, payload,
    seq_id AS next_cursor
  FROM base;
$$;

GRANT EXECUTE ON FUNCTION public.feed_fusion_home(uuid, text, bigint, int) TO authenticated;

-- Update feed_fusion_profile to use canonical target_entity_id
CREATE OR REPLACE FUNCTION public.feed_fusion_profile(
  p_profile_id uuid,
  p_cursor bigint DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE(
  post_id uuid,
  kind text,
  author_id uuid,
  target_entity_id uuid,
  created_at timestamptz,
  payload jsonb,
  next_cursor bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.id AS post_id,
      p.kind::text,
      COALESCE(p.author_user_id, p.author_id) AS author_id,
      pt.target_entity_id,
      p.created_at,
      jsonb_build_object(
        'body', p.body,
        'media', p.media,
        'author_id', COALESCE(p.author_user_id, p.author_id)
      ) AS payload,
      extract(epoch from p.created_at)::bigint AS seq_id
    FROM posts p
    JOIN post_targets pt ON pt.post_id = p.id
    WHERE pt.approved = true
      AND COALESCE(p.author_user_id, p.author_id) = p_profile_id
      AND (p_cursor IS NULL OR extract(epoch from p.created_at)::bigint < p_cursor)
    ORDER BY p.created_at DESC
    LIMIT p_limit
  )
  SELECT
    post_id, kind, author_id, target_entity_id, created_at, payload,
    seq_id AS next_cursor
  FROM base;
$$;

GRANT EXECUTE ON FUNCTION public.feed_fusion_profile(uuid, bigint, int) TO authenticated;