-- PR2 Performance Optimization + feed_hide RPC

-- Add composite index for optimal feed queries
CREATE INDEX IF NOT EXISTS idx_post_targets_feed_query 
  ON public.post_targets(target_entity_id, approved, created_at DESC);

-- RPC: feed_hide (owner/member can hide posts from their entity's feed)
CREATE OR REPLACE FUNCTION public.feed_hide(
  p_entity_id UUID,
  p_post_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user owns or is member of entity
  IF NOT EXISTS (
    SELECT 1 FROM entities WHERE id = p_entity_id AND owner_user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM entity_members
    WHERE entity_id = p_entity_id AND member_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to hide posts on this entity';
  END IF;

  -- Insert hide record
  INSERT INTO feed_hides (entity_id, post_id, hidden_by_user, reason)
  VALUES (p_entity_id, p_post_id, auth.uid(), p_reason)
  ON CONFLICT (entity_id, post_id) DO NOTHING;

  -- Log to Rocker
  INSERT INTO ai_action_ledger (user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'feed_hide',
    jsonb_build_object('entity_id', p_entity_id, 'post_id', p_post_id),
    jsonb_build_object('success', true),
    'success'
  );
END;
$$;