-- Add missing workspace and incentive RPCs

-- Get list of workspaces (entities) user has access to
CREATE OR REPLACE FUNCTION public.get_user_workspaces()
RETURNS TABLE(
  entity_id UUID,
  entity_type entity_kind,
  display_name TEXT,
  handle CITEXT,
  role TEXT,
  is_owner BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Personal workspace (always accessible)
  SELECT 
    NULL::UUID as entity_id,
    'person'::entity_kind as entity_type,
    'Personal' as display_name,
    NULL::CITEXT as handle,
    'owner' as role,
    true as is_owner
  WHERE auth.uid() IS NOT NULL
  
  UNION ALL
  
  -- Owned entities
  SELECT 
    e.id as entity_id,
    e.kind as entity_type,
    e.display_name,
    e.handle,
    'owner' as role,
    true as is_owner
  FROM entities e
  WHERE e.owner_user_id = auth.uid()
  
  UNION ALL
  
  -- Member entities
  SELECT 
    e.id as entity_id,
    e.kind as entity_type,
    e.display_name,
    e.handle,
    em.role as role,
    false as is_owner
  FROM entity_members em
  JOIN entities e ON e.id = em.entity_id
  WHERE em.member_user_id = auth.uid()
  
  ORDER BY is_owner DESC, display_name;
$$;

-- Get workspace summary (KPIs and stats for dashboard)
CREATE OR REPLACE FUNCTION public.get_workspace_summary(p_entity_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary JSONB := '{}'::JSONB;
  v_is_personal BOOLEAN;
BEGIN
  -- Check if this is personal workspace
  v_is_personal := (p_entity_id IS NULL);
  
  -- Verify access
  IF NOT v_is_personal THEN
    IF NOT EXISTS (
      SELECT 1 FROM entities 
      WHERE id = p_entity_id AND owner_user_id = auth.uid()
    ) AND NOT EXISTS (
      SELECT 1 FROM entity_members 
      WHERE entity_id = p_entity_id AND member_user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Access denied to workspace';
    END IF;
  END IF;
  
  -- Build summary object
  v_summary := jsonb_build_object(
    'entity_id', p_entity_id,
    'is_personal', v_is_personal,
    'listings_count', COALESCE((
      SELECT COUNT(*) FROM marketplace_listings 
      WHERE (v_is_personal AND created_by = auth.uid()) 
         OR (NOT v_is_personal AND entity_id = p_entity_id)
    ), 0),
    'orders_count', COALESCE((
      SELECT COUNT(*) FROM orders 
      WHERE (v_is_personal AND user_id = auth.uid())
         OR (NOT v_is_personal AND EXISTS (
           SELECT 1 FROM order_line_items oli
           JOIN marketplace_listings ml ON ml.id = oli.listing_id
           WHERE oli.order_id = orders.id AND ml.entity_id = p_entity_id
         ))
    ), 0),
    'events_count', COALESCE((
      SELECT COUNT(*) FROM events 
      WHERE (v_is_personal AND created_by = auth.uid())
         OR (NOT v_is_personal AND host_profile_id = p_entity_id)
    ), 0),
    'entries_count', COALESCE((
      SELECT COUNT(*) FROM entries 
      WHERE (v_is_personal AND rider_user_id = auth.uid())
         OR (NOT v_is_personal AND horse_entity_id = p_entity_id)
    ), 0),
    'messages_unread', COALESCE((
      SELECT COUNT(*) FROM messages m
      LEFT JOIN conversation_sessions cs ON cs.id = m.session_id
      WHERE m.recipient_user_id = auth.uid() 
        AND cs.last_read_at IS NULL
    ), 0)
  );
  
  RETURN v_summary;
END;
$$;

-- Attach incentive to event (allows both incentive owner and event organizer)
CREATE OR REPLACE FUNCTION public.attach_incentive_to_event(
  p_entity_id UUID,
  p_incentive_id UUID,
  p_event_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_incentive RECORD;
  v_event RECORD;
  v_can_attach BOOLEAN := false;
BEGIN
  -- Get incentive details
  SELECT * INTO v_incentive FROM incentives WHERE id = p_incentive_id;
  IF v_incentive.id IS NULL THEN
    RAISE EXCEPTION 'Incentive not found';
  END IF;
  
  -- Get event details
  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  IF v_event.id IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Check if user can attach (either owns incentive or manages event)
  v_can_attach := (
    -- User owns the incentive's entity
    EXISTS (
      SELECT 1 FROM entities 
      WHERE id = v_incentive.owner_entity_id 
        AND owner_user_id = auth.uid()
    )
    OR
    -- User is member of incentive's entity
    EXISTS (
      SELECT 1 FROM entity_members 
      WHERE entity_id = v_incentive.owner_entity_id 
        AND member_user_id = auth.uid()
    )
    OR
    -- User owns the event's host entity
    EXISTS (
      SELECT 1 FROM entities 
      WHERE id = v_event.host_profile_id 
        AND owner_user_id = auth.uid()
    )
    OR
    -- User is member of event's host entity
    EXISTS (
      SELECT 1 FROM entity_members 
      WHERE entity_id = v_event.host_profile_id 
        AND member_user_id = auth.uid()
    )
  );
  
  IF NOT v_can_attach THEN
    RAISE EXCEPTION 'Not authorized to attach incentive to event';
  END IF;
  
  -- Create the link (using promotion_targets as the junction table)
  INSERT INTO promotion_targets (
    incentive_id,
    target_type,
    target_id,
    added_by_entity_id,
    added_by_user_id,
    created_at
  )
  VALUES (
    p_incentive_id,
    'event',
    p_event_id,
    p_entity_id,
    auth.uid(),
    NOW()
  )
  ON CONFLICT (incentive_id, target_type, target_id) 
  DO UPDATE SET 
    updated_at = NOW(),
    added_by_user_id = auth.uid();
  
  -- Log the action
  INSERT INTO ai_action_ledger (
    user_id,
    agent,
    action,
    input,
    output,
    result
  )
  VALUES (
    auth.uid(),
    'user',
    'attach_incentive_to_event',
    jsonb_build_object(
      'entity_id', p_entity_id,
      'incentive_id', p_incentive_id,
      'event_id', p_event_id
    ),
    jsonb_build_object(
      'success', true,
      'incentive_name', v_incentive.name,
      'event_title', v_event.title
    ),
    'success'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'incentive_id', p_incentive_id,
    'event_id', p_event_id,
    'message', 'Incentive attached to event successfully'
  );
END;
$$;