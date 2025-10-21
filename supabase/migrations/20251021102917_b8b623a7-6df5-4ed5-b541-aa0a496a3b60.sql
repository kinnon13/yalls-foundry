-- Add service role policy for rocker_messages to allow Andy/Rocker edge functions to read chat history
CREATE POLICY "Service role can read all messages"
ON public.rocker_messages
FOR SELECT
TO service_role
USING (true);

-- Add service role policy for rocker_threads
CREATE POLICY "Service role can read all threads"
ON public.rocker_threads
FOR SELECT
TO service_role
USING (true);

-- Add service role write access for Andy to insert messages
CREATE POLICY "Service role can insert messages"
ON public.rocker_messages
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add service role write access for threads
CREATE POLICY "Service role can insert threads"
ON public.rocker_threads
FOR INSERT
TO service_role
WITH CHECK (true);