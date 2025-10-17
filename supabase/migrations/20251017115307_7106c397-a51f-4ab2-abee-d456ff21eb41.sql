-- Auto-spawn kernel triggers for common relationships

-- Trigger: When user enters horse in event/incentive
CREATE OR REPLACE FUNCTION public.trigger_entry_kernel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_horse_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get horse owner and name
    SELECT owner_user_id, display_name INTO v_owner_id, v_horse_name
    FROM entities
    WHERE id = NEW.horse_entity_id;
    
    IF v_owner_id IS NOT NULL THEN
      INSERT INTO kernel_contexts(user_id, kernel_type, context_entity_id, context_data, source, priority)
      VALUES (
        v_owner_id,
        'incentive_entry',
        NEW.horse_entity_id,
        jsonb_build_object(
          'class_id', NEW.class_id, 
          'entry_id', NEW.id, 
          'status', NEW.status,
          'horse_name', v_horse_name
        ),
        'entry',
        10 -- High priority
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_entry_kernel ON public.entries;
CREATE TRIGGER trigger_entry_kernel
  AFTER INSERT ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.trigger_entry_kernel();

-- Trigger: When user follows entity (farm, business, etc.)
CREATE OR REPLACE FUNCTION public.trigger_follow_kernel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_name TEXT;
  v_entity_kind TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get entity info
    SELECT display_name, kind INTO v_entity_name, v_entity_kind
    FROM entities
    WHERE id = NEW.followed_entity_id;
    
    INSERT INTO kernel_contexts(user_id, kernel_type, context_entity_id, context_data, source, priority)
    VALUES (
      NEW.follower_user_id,
      'entity_updates',
      NEW.followed_entity_id,
      jsonb_build_object(
        'entity_name', v_entity_name,
        'entity_kind', v_entity_kind,
        'followed_at', NEW.created_at
      ),
      'follow',
      50 -- Medium priority
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: Apply this trigger when follows table exists
-- DROP TRIGGER IF EXISTS trigger_follow_kernel ON public.follows;
-- CREATE TRIGGER trigger_follow_kernel
--   AFTER INSERT ON public.follows
--   FOR EACH ROW EXECUTE FUNCTION public.trigger_follow_kernel();

-- Trigger: When user joins business team
CREATE OR REPLACE FUNCTION public.trigger_team_kernel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO v_business_name
    FROM businesses
    WHERE id = NEW.business_id;
    
    INSERT INTO kernel_contexts(user_id, kernel_type, context_entity_id, context_data, source, priority)
    VALUES (
      NEW.user_id,
      'team_workspace',
      NEW.business_id,
      jsonb_build_object(
        'business_name', v_business_name,
        'role', NEW.role,
        'joined_at', NEW.created_at
      ),
      'team_member',
      20 -- High priority
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_team_kernel ON public.business_team;
CREATE TRIGGER trigger_team_kernel
  AFTER INSERT ON public.business_team
  FOR EACH ROW EXECUTE FUNCTION public.trigger_team_kernel();

-- Cleanup: Remove expired/completed kernels
CREATE OR REPLACE FUNCTION public.cleanup_expired_kernels()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM kernel_contexts
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_kernels() TO authenticated;