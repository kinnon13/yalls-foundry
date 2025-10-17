-- PR2.5: Feed Moderation & Approvals RPCs + Indexes

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feed_hides_entity_post ON feed_hides(entity_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_targets_pending ON post_targets(target_entity_id, approved);

-- RPC: Hide post from entity feed
CREATE OR REPLACE FUNCTION public.feed_hide(p_post_id uuid, p_entity_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Verify user owns or manages the entity
  IF NOT EXISTS (
    SELECT 1 FROM entities e
    LEFT JOIN entity_members m ON m.entity_id = e.id AND m.member_user_id = auth.uid()
    WHERE e.id = p_entity_id 
    AND (e.owner_user_id = auth.uid() OR m.role IN ('owner','admin','editor'))
  ) THEN 
    RAISE EXCEPTION 'Not authorized to hide posts on this entity';
  END IF;

  -- Insert hide record
  INSERT INTO feed_hides(entity_id, post_id, hidden_by_user)
  VALUES (p_entity_id, p_post_id, auth.uid())
  ON CONFLICT (entity_id, post_id) DO NOTHING;

  -- Log to Rocker
  INSERT INTO ai_action_ledger(user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'feed_hide',
    jsonb_build_object('post_id', p_post_id, 'entity_id', p_entity_id),
    jsonb_build_object('success', true),
    'success'
  );
END;
$$;

-- RPC: Unhide post from entity feed
CREATE OR REPLACE FUNCTION public.feed_unhide(p_post_id uuid, p_entity_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Verify user owns or manages the entity
  IF NOT EXISTS (
    SELECT 1 FROM entities e
    LEFT JOIN entity_members m ON m.entity_id = e.id AND m.member_user_id = auth.uid()
    WHERE e.id = p_entity_id 
    AND (e.owner_user_id = auth.uid() OR m.role IN ('owner','admin','editor'))
  ) THEN 
    RAISE EXCEPTION 'Not authorized to unhide posts on this entity';
  END IF;

  -- Delete hide record
  DELETE FROM feed_hides
  WHERE entity_id = p_entity_id AND post_id = p_post_id;

  -- Log to Rocker
  INSERT INTO ai_action_ledger(user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'feed_unhide',
    jsonb_build_object('post_id', p_post_id, 'entity_id', p_entity_id),
    jsonb_build_object('success', true),
    'success'
  );
END;
$$;

-- RPC: Approve pending cross-post
CREATE OR REPLACE FUNCTION public.post_target_approve(p_post_id uuid, p_entity_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Verify user owns or manages the entity
  IF NOT EXISTS (
    SELECT 1 FROM entities e
    LEFT JOIN entity_members m ON m.entity_id = e.id AND m.member_user_id = auth.uid()
    WHERE e.id = p_entity_id 
    AND (e.owner_user_id = auth.uid() OR m.role IN ('owner','admin','editor'))
  ) THEN 
    RAISE EXCEPTION 'Not authorized to approve posts on this entity';
  END IF;

  -- Approve the target
  UPDATE post_targets
  SET approved = true
  WHERE post_id = p_post_id AND target_entity_id = p_entity_id;

  -- Log to Rocker
  INSERT INTO ai_action_ledger(user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'post_target_approve',
    jsonb_build_object('post_id', p_post_id, 'entity_id', p_entity_id),
    jsonb_build_object('success', true),
    'success'
  );
END;
$$;

-- RPC: Reject pending cross-post
CREATE OR REPLACE FUNCTION public.post_target_reject(p_post_id uuid, p_entity_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Verify user owns or manages the entity
  IF NOT EXISTS (
    SELECT 1 FROM entities e
    LEFT JOIN entity_members m ON m.entity_id = e.id AND m.member_user_id = auth.uid()
    WHERE e.id = p_entity_id 
    AND (e.owner_user_id = auth.uid() OR m.role IN ('owner','admin','editor'))
  ) THEN 
    RAISE EXCEPTION 'Not authorized to reject posts on this entity';
  END IF;

  -- Delete the target
  DELETE FROM post_targets
  WHERE post_id = p_post_id AND target_entity_id = p_entity_id;

  -- Log to Rocker
  INSERT INTO ai_action_ledger(user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'post_target_reject',
    jsonb_build_object('post_id', p_post_id, 'entity_id', p_entity_id),
    jsonb_build_object('success', true),
    'success'
  );
END;
$$;

-- RPC: Get pending targets for entity
CREATE OR REPLACE FUNCTION public.feed_pending_targets(p_entity_id uuid)
RETURNS TABLE(
  post_id uuid,
  target_entity_id uuid,
  source_post_id uuid,
  reason text,
  approved boolean,
  created_at timestamptz
)
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT 
    pt.post_id,
    pt.target_entity_id,
    pt.source_post_id,
    pt.reason,
    pt.approved,
    pt.created_at
  FROM post_targets pt
  WHERE pt.target_entity_id = p_entity_id 
  AND pt.approved = false
  ORDER BY pt.created_at DESC;
$$;