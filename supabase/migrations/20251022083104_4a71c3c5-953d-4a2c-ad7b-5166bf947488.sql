-- Minimal migration: create ai_user_profiles only (fix policy syntax)
CREATE TABLE IF NOT EXISTS public.ai_user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tone text DEFAULT 'friendly concise',
  verbosity text DEFAULT 'medium' CHECK (verbosity IN ('low','medium','high')),
  format_pref text DEFAULT 'bullets' CHECK (format_pref IN ('bullets','prose','mixed')),
  visual_pref boolean DEFAULT false,
  approval_mode text DEFAULT 'ask' CHECK (approval_mode IN ('auto','ask')),
  work_hours jsonb DEFAULT '{"start":"09:00","end":"17:00"}'::jsonb,
  channel_prefs jsonb DEFAULT '{"email":true,"sms":false,"in_app":true}'::jsonb,
  taboo_topics text[] DEFAULT ARRAY[]::text[],
  goal_weights jsonb DEFAULT '{"speed":1.0,"quality":1.0,"cost":1.0}'::jsonb,
  suggestion_freq text DEFAULT 'daily' CHECK (suggestion_freq IN ('hourly','daily','weekly','off')),
  private_mode_default boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY sr_all_profiles ON public.ai_user_profiles FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE POLICY user_read_own_profile ON public.ai_user_profiles FOR SELECT TO authenticated USING(auth.uid() = user_id);
CREATE POLICY user_update_own_profile ON public.ai_user_profiles FOR UPDATE TO authenticated USING(auth.uid() = user_id) WITH CHECK(auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ai_user_profiles_user_idx ON public.ai_user_profiles(user_id);