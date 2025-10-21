-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.rocker_messages;
DROP POLICY IF EXISTS "p_msgs_rw" ON public.rocker_messages;
DROP POLICY IF EXISTS "Admins can view all user messages" ON public.rocker_messages;
DROP POLICY IF EXISTS "Users can manage their own threads" ON public.rocker_threads;
DROP POLICY IF EXISTS "p_threads_rw" ON public.rocker_threads;

-- ROCKER_MESSAGES: Users can manage their own messages
CREATE POLICY "Users can manage their own messages"
ON public.rocker_messages
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ROCKER_MESSAGES: Super admins can view and manage all messages
CREATE POLICY "Super admins can manage all messages"
ON public.rocker_messages
FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- ROCKER_THREADS: Users can manage their own threads
CREATE POLICY "Users can manage their own threads"
ON public.rocker_threads
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ROCKER_THREADS: Super admins can view and manage all threads
CREATE POLICY "Super admins can manage all threads"
ON public.rocker_threads
FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Create scrubbed message summaries table for admin access
CREATE TABLE IF NOT EXISTS public.rocker_message_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.rocker_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  summary_date date NOT NULL,
  message_count int NOT NULL DEFAULT 0,
  topics jsonb DEFAULT '[]'::jsonb,
  key_themes text[],
  interaction_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.rocker_message_summaries ENABLE ROW LEVEL SECURITY;

-- Admins can view scrubbed summaries (no full content)
CREATE POLICY "Admins can view message summaries"
ON public.rocker_message_summaries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
  OR is_super_admin()
);

-- Service role can manage summaries
CREATE POLICY "Service can manage summaries"
ON public.rocker_message_summaries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rocker_message_summaries_user ON public.rocker_message_summaries(user_id, summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_rocker_message_summaries_thread ON public.rocker_message_summaries(thread_id);

-- Function to generate scrubbed summaries (called by edge function)
CREATE OR REPLACE FUNCTION generate_message_summary(
  p_thread_id uuid,
  p_user_id uuid,
  p_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_topics jsonb;
  v_themes text[];
BEGIN
  -- Count messages
  SELECT COUNT(*) INTO v_count
  FROM rocker_messages
  WHERE thread_id = p_thread_id
  AND user_id = p_user_id
  AND DATE(created_at) = p_date;

  -- Extract topics (without revealing content)
  SELECT jsonb_agg(DISTINCT jsonb_build_object(
    'timestamp', created_at,
    'role', role,
    'has_content', content IS NOT NULL
  ))
  INTO v_topics
  FROM rocker_messages
  WHERE thread_id = p_thread_id
  AND user_id = p_user_id
  AND DATE(created_at) = p_date;

  -- Insert or update summary
  INSERT INTO rocker_message_summaries(
    thread_id, user_id, summary_date, message_count, topics
  ) VALUES (
    p_thread_id, p_user_id, p_date, v_count, COALESCE(v_topics, '[]'::jsonb)
  )
  ON CONFLICT (thread_id, summary_date)
  DO UPDATE SET
    message_count = EXCLUDED.message_count,
    topics = EXCLUDED.topics,
    updated_at = now();

  RETURN jsonb_build_object(
    'message_count', v_count,
    'summary_date', p_date
  );
END;
$$;

-- Add unique constraint for summaries
CREATE UNIQUE INDEX IF NOT EXISTS idx_rocker_message_summaries_unique 
ON public.rocker_message_summaries(thread_id, summary_date);