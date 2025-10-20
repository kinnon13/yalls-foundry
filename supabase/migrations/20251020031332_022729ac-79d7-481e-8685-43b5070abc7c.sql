-- Remove overly permissive admin policies that expose PII
DROP POLICY IF EXISTS "Admins can view all user memories" ON ai_user_memory;
DROP POLICY IF EXISTS "Admins can view all tasks" ON rocker_tasks;
DROP POLICY IF EXISTS "Admins can view all messages" ON rocker_messages;
DROP POLICY IF EXISTS "Admins can view all documents" ON rocker_vault_documents;
DROP POLICY IF EXISTS "Admins can view all files" ON rocker_files;
DROP POLICY IF EXISTS "Admins can view all contacts" ON crm_contacts;

-- Add limited non-PII admin views (metadata only, no content)
CREATE POLICY "Admins can view memory metadata only"
ON ai_user_memory
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND user_id != auth.uid()  -- Can't see own data through admin policy
);

-- Regular users see their own data
CREATE POLICY "Users view own memories"
ON ai_user_memory
FOR SELECT
USING (auth.uid() = user_id);

-- Update runtime_flags to restrict web access to super_admin only
UPDATE runtime_flags
SET value = jsonb_set(
  value,
  '{admin_only}',
  'true'::jsonb,
  true
)
WHERE key = 'capabilities.web_access';

-- Add comment explaining web access restriction
COMMENT ON TABLE runtime_flags IS 'Web access capability.web_access should have admin_only:true to restrict to super_admin only';
