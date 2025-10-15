-- Ensure RLS is enabled for conversation storage
ALTER TABLE IF EXISTS public.rocker_conversations ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own conversation messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'rocker_conversations' 
      AND policyname = 'Users can insert their conversations'
  ) THEN
    CREATE POLICY "Users can insert their conversations"
    ON public.rocker_conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to view their own conversation messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'rocker_conversations' 
      AND policyname = 'Users can view their conversations'
  ) THEN
    CREATE POLICY "Users can view their conversations"
    ON public.rocker_conversations
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;