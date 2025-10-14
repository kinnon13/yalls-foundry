-- Phase 3.5: Profile Tombstone + Safe Account Deletion (v1.1)
-- Enables soft-delete with PII anonymization, decoupled from auth.users cascade

-- Step 1: Add deleted_at column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Step 2: Change user_id FK to ON DELETE SET NULL (allows auth delete without cascade)
-- First drop existing FK constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Re-add with SET NULL on delete
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Step 3: Add business freeze columns for orphan admin protection
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS frozen BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS frozen_reason TEXT;

-- Step 4: Create SECURITY DEFINER RPC for safe account deletion
CREATE OR REPLACE FUNCTION public.delete_account_prepare()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _profile_id uuid;
  _sole_admin_businesses jsonb;
  _result jsonb;
BEGIN
  -- Guard: must be authenticated
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get profile ID
  SELECT id INTO _profile_id FROM public.profiles WHERE user_id = _user_id;
  
  IF _profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Check for sole admin on businesses
  SELECT jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name))
  INTO _sole_admin_businesses
  FROM public.businesses b
  WHERE b.owner_id = _user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.business_team bt
      WHERE bt.business_id = b.id 
        AND bt.role = 'admin' 
        AND bt.user_id != _user_id
    );

  -- Block if sole admin (must transfer first)
  IF _sole_admin_businesses IS NOT NULL AND jsonb_array_length(_sole_admin_businesses) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'sole_admin',
      'message', 'You are the sole admin on one or more businesses. Transfer admin rights before deleting your account.',
      'business_ids', _sole_admin_businesses
    );
  END IF;

  -- Anonymize profile (PII redaction)
  UPDATE public.profiles
  SET 
    display_name = 'Deleted User',
    bio = NULL,
    avatar_url = NULL,
    deleted_at = now(),
    updated_at = now()
  WHERE id = _profile_id;

  -- Clear entity claims (entities become unclaimed)
  UPDATE public.entity_profiles
  SET claimed_by = NULL, updated_at = now()
  WHERE claimed_by = _user_id;

  -- Remove business team memberships (CASCADE handles this, but explicit for clarity)
  DELETE FROM public.business_team WHERE user_id = _user_id;

  -- Audit log
  INSERT INTO public.admin_audit_log (action, actor_user_id, metadata)
  VALUES (
    'account_deleted',
    _user_id,
    jsonb_build_object('profile_id', _profile_id, 'timestamp', now())
  );

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Account anonymized. Entities unclaimed. Safe to delete auth user.',
    'profile_id', _profile_id
  );
END;
$$;

-- Step 5: Create audit log table if not exists (for delete tracking)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_user_id UUID, -- nullable (user might be deleted)
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit log
CREATE POLICY "Admins can view audit log"
ON public.admin_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Step 6: Update RLS policies on profiles to handle deleted_at
-- Already have "Profiles are viewable by everyone" - this shows deleted (tombstone visible)
-- Add policy to filter deleted in most contexts (optional - depends on UX)
CREATE POLICY "Hide deleted profiles from public list"
ON public.profiles
FOR SELECT
USING (deleted_at IS NULL OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Step 7: Index for deleted_at queries
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Grants
GRANT EXECUTE ON FUNCTION public.delete_account_prepare() TO authenticated;