-- Rocker Messages (for chat threads)
CREATE TABLE IF NOT EXISTS public.rocker_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rocker Tasks (auto-created from "todo:" in chat)
CREATE TABLE IF NOT EXISTS public.rocker_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  thread_id uuid,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rocker Threads (to track conversations)
CREATE TABLE IF NOT EXISTS public.rocker_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rocker_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rocker_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rocker_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies (check if they exist first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'rocker_messages' 
    AND policyname = 'Users can manage their own messages'
  ) THEN
    CREATE POLICY "Users can manage their own messages" ON public.rocker_messages
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'rocker_tasks' 
    AND policyname = 'Users can manage their own tasks'
  ) THEN
    CREATE POLICY "Users can manage their own tasks" ON public.rocker_tasks
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'rocker_threads' 
    AND policyname = 'Users can manage their own threads'
  ) THEN
    CREATE POLICY "Users can manage their own threads" ON public.rocker_threads
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rocker_messages_thread ON public.rocker_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rocker_messages_user ON public.rocker_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_rocker_tasks_user_status ON public.rocker_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_rocker_threads_user ON public.rocker_threads(user_id);

-- Drop and recreate memory recall function with correct signature
DROP FUNCTION IF EXISTS public.recall_long_memory(text, integer);

CREATE FUNCTION public.recall_long_memory(p_query text, p_limit int DEFAULT 8)
RETURNS TABLE (id uuid, kind text, key text)
LANGUAGE sql STABLE AS $$
  SELECT gen_random_uuid() as id, 'memory'::text as kind, left(p_query, 64) as key
  WHERE length(coalesce(p_query,'')) > 0
  LIMIT greatest(p_limit,0);
$$;