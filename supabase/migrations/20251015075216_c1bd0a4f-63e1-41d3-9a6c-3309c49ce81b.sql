-- Fix calendars INSERT policy to work with edge functions
DROP POLICY IF EXISTS "Users can create their own calendars" ON calendars;

CREATE POLICY "Users can create their own calendars"
ON calendars
FOR INSERT
TO authenticated
WITH CHECK (owner_profile_id = auth.uid());