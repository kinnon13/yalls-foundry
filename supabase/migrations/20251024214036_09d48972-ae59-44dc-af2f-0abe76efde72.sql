-- Yallbrary: App Store Registry and Pinning Tables
-- Role: Database schema for app metadata, user pins, and access control

-- Create yallbrary_apps table (app registry)
CREATE TABLE IF NOT EXISTS public.yallbrary_apps (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  customization JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create yallbrary_pins table (user pins)
CREATE TABLE IF NOT EXISTS public.yallbrary_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL REFERENCES public.yallbrary_apps(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  customization JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, app_id)
);

-- Enable RLS
ALTER TABLE public.yallbrary_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yallbrary_pins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for yallbrary_apps
CREATE POLICY "Anyone can view public apps"
  ON public.yallbrary_apps FOR SELECT
  USING (is_public = true);

CREATE POLICY "Admins can manage all apps"
  ON public.yallbrary_apps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for yallbrary_pins
CREATE POLICY "Users can view their own pins"
  ON public.yallbrary_pins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pins"
  ON public.yallbrary_pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pins"
  ON public.yallbrary_pins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pins"
  ON public.yallbrary_pins FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_yallbrary_apps_public ON public.yallbrary_apps(is_public);
CREATE INDEX idx_yallbrary_apps_category ON public.yallbrary_apps(category);
CREATE INDEX idx_yallbrary_pins_user ON public.yallbrary_pins(user_id);
CREATE INDEX idx_yallbrary_pins_position ON public.yallbrary_pins(user_id, position);

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_yallbrary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_yallbrary_apps_updated_at
  BEFORE UPDATE ON public.yallbrary_apps
  FOR EACH ROW EXECUTE FUNCTION update_yallbrary_updated_at();

CREATE TRIGGER update_yallbrary_pins_updated_at
  BEFORE UPDATE ON public.yallbrary_pins
  FOR EACH ROW EXECUTE FUNCTION update_yallbrary_updated_at();