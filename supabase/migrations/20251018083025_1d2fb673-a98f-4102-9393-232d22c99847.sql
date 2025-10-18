-- Pin types enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='pin_type') THEN
    CREATE TYPE pin_type AS ENUM ('entity','app','route','folder');
  END IF;
END $$;

-- Pin folders (optional organization)
CREATE TABLE IF NOT EXISTS public.pin_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  color text,
  sort_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User pins (replaces profile_pins)
CREATE TABLE IF NOT EXISTS public.user_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_type pin_type NOT NULL,
  ref_id text NOT NULL,
  title text,
  metadata jsonb DEFAULT '{}'::jsonb,
  folder_id uuid REFERENCES public.pin_folders(id) ON DELETE SET NULL,
  sort_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_pins_unique
  ON public.user_pins(user_id, pin_type, ref_id);

-- RLS
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY pins_read  ON public.user_pins  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY pins_write ON public.user_pins  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY pins_upd   ON public.user_pins  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY pins_del   ON public.user_pins  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY pf_read  ON public.pin_folders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY pf_write ON public.pin_folders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY pf_upd   ON public.pin_folders FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY pf_del   ON public.pin_folders FOR DELETE USING (user_id = auth.uid());