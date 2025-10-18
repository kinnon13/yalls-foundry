-- Appearance Settings (wallpaper + screensaver)
CREATE TABLE IF NOT EXISTS public.appearance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('user','entity')),
  subject_id UUID NOT NULL,
  wallpaper_url TEXT,
  screensaver_payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject_type, subject_id)
);

ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can manage appearance"
  ON public.appearance_settings
  FOR ALL USING (
    (subject_type='user' AND subject_id = auth.uid())
    OR
    (subject_type='entity' AND subject_id IN (
      SELECT e.id FROM public.entities e WHERE e.id = appearance_settings.subject_id AND e.owner_user_id = auth.uid()
    ))
  );

-- Pin Folders
CREATE TABLE IF NOT EXISTS public.user_pin_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('home','apps','horses','businesses','people','custom')),
  title TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_index INT NOT NULL DEFAULT 1000,
  parent_folder_id UUID REFERENCES public.user_pin_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, section, title)
);

ALTER TABLE public.user_pin_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_full" ON public.user_pin_folders
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Update user_pins with section and folder_id
ALTER TABLE public.user_pins
  ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.user_pin_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_pins_by_user_section ON public.user_pins(user_id, section, sort_index);

-- RPC to set appearance
CREATE OR REPLACE FUNCTION public.set_appearance(
  p_subject_type TEXT,
  p_subject_id UUID,
  p_wallpaper TEXT,
  p_screensaver JSONB
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.appearance_settings(subject_type, subject_id, wallpaper_url, screensaver_payload)
  VALUES (p_subject_type, p_subject_id, p_wallpaper, p_screensaver)
  ON CONFLICT (subject_type, subject_id)
  DO UPDATE SET 
    wallpaper_url = EXCLUDED.wallpaper_url,
    screensaver_payload = EXCLUDED.screensaver_payload,
    updated_at = now();
END$$;