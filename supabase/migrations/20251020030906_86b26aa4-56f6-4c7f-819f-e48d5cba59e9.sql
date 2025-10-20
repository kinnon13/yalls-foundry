-- Add admin override policies for full user data access
-- This is required for legal/compliance access to all user data

-- AI User Memory - Admin can see ALL
CREATE POLICY "Admins can view all user memories" 
ON ai_user_memory 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
  OR user_id = auth.uid()
);

-- Rocker Tasks - Admin can see ALL
CREATE POLICY "Admins can view all user tasks" 
ON rocker_tasks 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
  OR user_id = auth.uid()
);

-- Rocker Messages - Admin can see ALL
CREATE POLICY "Admins can view all user messages" 
ON rocker_messages 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
  OR user_id = auth.uid()
);

-- Rocker Vault Documents - Admin can see ALL
CREATE POLICY "Admins can view all vault documents" 
ON rocker_vault_documents 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
  OR user_id = auth.uid()
);

-- Rocker Files - Admin can see ALL
CREATE POLICY "Admins can view all user files" 
ON rocker_files 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
  OR user_id = auth.uid()
);

-- CRM Contacts - Admin can see ALL
CREATE POLICY "Admins can view all crm contacts" 
ON crm_contacts 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
  OR owner_user_id = auth.uid()
);

-- Update web access to blocklist mode (allows all except blocked domains)
UPDATE runtime_flags 
SET value = jsonb_build_object(
  'enabled', true,
  'mode', 'blocklist'
)
WHERE key = 'capabilities.web_access';