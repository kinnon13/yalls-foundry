-- PR2.5: Feed Approvals & Hide UI RPCs

-- Index for pending lookups + ordering
CREATE INDEX IF NOT EXISTS idx_post_targets_entity_approved_created
  ON public.post_targets(target_entity_id, approved, created_at DESC);

-- Updated: Pending approvals list with full post data
CREATE OR REPLACE FUNCTION public.feed_pending_targets(
  p_entity_id uuid,
  p_limit int DEFAULT 30,
  p_cursor timestamptz DEFAULT NULL
)
RETURNS TABLE(
  post_id uuid,
  post_created_at timestamptz,
  author_user_id uuid,
  author_name text,
  author_avatar text,
  body text,
  media jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Authorize: caller must own the entity being targeted
  WITH authz AS (
    SELECT 1
    FROM entities e
    WHERE e.id = p_entity_id AND e.owner_user_id = auth.uid()
  )
  SELECT
    p.id,
    p.created_at,
    p.author_user_id,
    prof.display_name,
    prof.avatar_url,
    p.body,
    p.media
  FROM post_targets pt
  JOIN posts p            ON p.id = pt.post_id
  LEFT JOIN profiles prof ON prof.user_id = p.author_user_id
  WHERE pt.target_entity_id = p_entity_id
    AND pt.approved IS NULL
    AND p.created_at < COALESCE(p_cursor, now())
    AND EXISTS (SELECT 1 FROM authz)
  ORDER BY p.created_at DESC, p.id DESC
  LIMIT p_limit;
$$;

-- New: Approve target
CREATE OR REPLACE FUNCTION public.post_approve_target(
  p_post_id uuid,
  p_entity_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owned boolean;
BEGIN
  SELECT TRUE
  INTO v_owned
  FROM entities e
  WHERE e.id = p_entity_id AND e.owner_user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized to approve for this entity';
  END IF;

  UPDATE public.post_targets
  SET approved = TRUE,
      updated_at = now()
  WHERE post_id = p_post_id
    AND target_entity_id = p_entity_id
    AND approved IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending target to approve';
  END IF;

  -- Ledger
  INSERT INTO public.ai_action_ledger(user_id, agent, action, input, output, result)
  VALUES (auth.uid(), 'human', 'post_approve_target',
          jsonb_build_object('post_id', p_post_id, 'entity_id', p_entity_id),
          jsonb_build_object('status','approved'), 'success');

  RETURN jsonb_build_object('status','ok');
END;
$$;

-- New: Reject target
CREATE OR REPLACE FUNCTION public.post_reject_target(
  p_post_id uuid,
  p_entity_id uuid,
  p_reason text DEFAULT 'rejected_by_owner'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM 1 FROM entities e
  WHERE e.id = p_entity_id AND e.owner_user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized to reject for this entity';
  END IF;

  UPDATE public.post_targets
  SET approved = FALSE,
      updated_at = now(),
      reason = COALESCE(p_reason, 'rejected_by_owner')
  WHERE post_id = p_post_id
    AND target_entity_id = p_entity_id
    AND approved IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending target to reject';
  END IF;

  INSERT INTO public.ai_action_ledger(user_id, agent, action, input, output, result)
  VALUES (auth.uid(), 'human', 'post_reject_target',
          jsonb_build_object('post_id', p_post_id, 'entity_id', p_entity_id, 'reason', p_reason),
          jsonb_build_object('status','rejected'), 'success');

  RETURN jsonb_build_object('status','ok');
END;
$$;