-- Safe account deletion: preserve data on auth.users delete
-- Only update constraints for existing tables

-- Add deleted_at to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Profiles: keep row, unlink auth (ON DELETE SET NULL)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
  ADD CONSTRAINT profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Team: cascade delete only this user's memberships
ALTER TABLE public.business_team
  DROP CONSTRAINT IF EXISTS business_team_user_id_fkey,
  ADD CONSTRAINT business_team_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Events: keep creator anchor, just unlink
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_created_by_fkey,
  ADD CONSTRAINT events_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- CRM activities: keep creator anchor
ALTER TABLE public.crm_activities
  DROP CONSTRAINT IF EXISTS crm_activities_created_by_fkey,
  ADD CONSTRAINT crm_activities_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Businesses: keep owner & creator anchors
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_owner_id_fkey,
  ADD CONSTRAINT businesses_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_created_by_fkey,
  ADD CONSTRAINT businesses_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create safe account deletion prep function
CREATE OR REPLACE FUNCTION public.delete_account_prepare()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_orphaned_biz_count int;
  v_orphaned_biz_ids uuid[];
BEGIN
  -- Find user's profile
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user';
  END IF;

  -- Check for sole-admin businesses
  SELECT COUNT(*), ARRAY_AGG(b.id)
  INTO v_orphaned_biz_count, v_orphaned_biz_ids
  FROM public.businesses b
  WHERE EXISTS (
    SELECT 1 FROM public.business_team t
    WHERE t.business_id = b.id 
      AND t.user_id = auth.uid() 
      AND t.role = 'admin'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.business_team t2
    WHERE t2.business_id = b.id 
      AND t2.user_id != auth.uid() 
      AND t2.role = 'admin'
  );

  -- Block deletion if sole admin
  IF v_orphaned_biz_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'sole_admin',
      'message', format('Cannot delete: you are the sole admin of %s business(es). Transfer admin role first.', v_orphaned_biz_count),
      'business_ids', v_orphaned_biz_ids
    );
  END IF;

  -- Anonymize profile (keep row for FK integrity)
  UPDATE public.profiles
  SET user_id = NULL,
      display_name = 'Deleted User ' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      bio = NULL,
      avatar_url = NULL,
      deleted_at = now()
  WHERE id = v_profile_id;

  -- Team memberships will auto-delete via CASCADE

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'anonymized_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_account_prepare() TO authenticated;

COMMENT ON FUNCTION public.delete_account_prepare() IS 
  'Prepares account for deletion: anonymizes profile, checks sole-admin status. Call before auth delete.';