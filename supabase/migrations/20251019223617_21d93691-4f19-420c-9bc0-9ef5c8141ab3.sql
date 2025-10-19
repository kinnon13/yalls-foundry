-- Role checking functions
CREATE OR REPLACE FUNCTION public.has_app_role(p_role text)
RETURNS boolean
LANGUAGE sql STABLE SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(
      coalesce( (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'roles')
              , '[]'::jsonb )
    ) r
    WHERE r = p_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SET search_path=public AS $$
  SELECT coalesce(public.has_app_role('super_admin'), false);
$$;

-- Rocker chat threads and messages
CREATE TABLE IF NOT EXISTS public.rocker_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rocker_messages (
  id bigserial PRIMARY KEY,
  thread_id uuid NOT NULL REFERENCES public.rocker_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for threads
ALTER TABLE public.rocker_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_threads_rw ON public.rocker_threads;
CREATE POLICY p_threads_rw ON public.rocker_threads
  FOR ALL
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

-- RLS for messages
ALTER TABLE public.rocker_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_msgs_rw ON public.rocker_messages;
CREATE POLICY p_msgs_rw ON public.rocker_messages
  FOR ALL
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rocker_threads_user ON public.rocker_threads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rocker_messages_thread ON public.rocker_messages(thread_id, created_at);

-- Helper RPCs
CREATE OR REPLACE FUNCTION public.start_rocker_thread(p_title text DEFAULT 'Chat')
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  INSERT INTO public.rocker_threads(user_id, title)
  VALUES (auth.uid(), COALESCE(p_title, 'Chat'))
  RETURNING id;
$$;

CREATE OR REPLACE FUNCTION public.append_rocker_message(p_thread uuid, p_role text, p_content text, p_meta jsonb DEFAULT '{}'::jsonb)
RETURNS bigint
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  INSERT INTO public.rocker_messages(thread_id, user_id, role, content, meta)
  VALUES (p_thread, auth.uid(), p_role, p_content, COALESCE(p_meta,'{}'::jsonb))
  RETURNING id;
$$;