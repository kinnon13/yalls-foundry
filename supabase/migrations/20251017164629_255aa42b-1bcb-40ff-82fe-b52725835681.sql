-- PR-S1 PART 4: Fix Security Definer Views (3 ERROR fixes)

-- ========================================
-- REMOVE SECURITY DEFINER FROM VIEWS
-- ========================================

-- 1. Fix ai_action_my_timeline (remove SECURITY DEFINER)
DROP VIEW IF EXISTS public.ai_action_my_timeline;

CREATE VIEW public.ai_action_my_timeline AS
SELECT 
  id,
  user_id,
  agent,
  action,
  input,
  output,
  result,
  correlation_id,
  created_at
FROM ai_action_ledger
WHERE COALESCE(user_id, auth.uid()) = auth.uid();

-- 2. Fix notif_center_view (remove SECURITY DEFINER)
DROP VIEW IF EXISTS public.notif_center_view;

CREATE VIEW public.notif_center_view AS
SELECT 
  nr.id AS receipt_id,
  n.id AS notif_id,
  n.category,
  n.priority,
  n.title,
  n.body,
  n.link,
  n.payload,
  n.created_at,
  nr.user_id,
  nr.seen_at,
  nr.read_at,
  nr.muted,
  nr.archived
FROM notification_receipts nr
JOIN notifications n ON n.id = nr.notif_id
WHERE nr.archived = false
  AND nr.user_id = auth.uid() -- Add RLS check directly in view
ORDER BY n.created_at DESC;

-- 3. Fix v_incentive_eligibility (remove SECURITY DEFINER) 
DROP VIEW IF EXISTS public.v_incentive_eligibility;

CREATE VIEW public.v_incentive_eligibility AS
SELECT 
  h.id AS horse_id,
  i.id AS incentive_id,
  i.program_name,
  i.deadline_at,
  (now() < i.deadline_at AND i.status = 'active') AS is_open,
  true AS meets_rules
FROM entities h
CROSS JOIN incentives i
WHERE h.kind = 'horse'::entity_kind;

-- ========================================
-- GRANT APPROPRIATE PERMISSIONS ON VIEWS
-- ========================================

GRANT SELECT ON public.ai_action_my_timeline TO authenticated;
GRANT SELECT ON public.notif_center_view TO authenticated;
GRANT SELECT ON public.v_incentive_eligibility TO authenticated;