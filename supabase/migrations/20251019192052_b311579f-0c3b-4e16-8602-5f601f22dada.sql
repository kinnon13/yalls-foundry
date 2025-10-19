-- Create user_apps table for installed apps tracking
CREATE TABLE IF NOT EXISTS public.user_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(user_id, app_id)
);

-- Enable RLS
ALTER TABLE public.user_apps ENABLE ROW LEVEL SECURITY;

-- Users can view their own installed apps
CREATE POLICY "Users can view their own apps"
  ON public.user_apps
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can install apps
CREATE POLICY "Users can install apps"
  ON public.user_apps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can uninstall apps
CREATE POLICY "Users can uninstall apps"
  ON public.user_apps
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_app_layout table for dock pinning and ordering
CREATE TABLE IF NOT EXISTS public.user_app_layout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, app_id)
);

-- Enable RLS
ALTER TABLE public.user_app_layout ENABLE ROW LEVEL SECURITY;

-- Users can view their own app layout
CREATE POLICY "Users can view their own app layout"
  ON public.user_app_layout
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their app layout
CREATE POLICY "Users can manage their app layout"
  ON public.user_app_layout
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_user_apps_user_id ON public.user_apps(user_id);
CREATE INDEX idx_user_app_layout_user_pinned ON public.user_app_layout(user_id, pinned, order_index);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_app_layout_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_app_layout_timestamp
  BEFORE UPDATE ON public.user_app_layout
  FOR EACH ROW
  EXECUTE FUNCTION update_user_app_layout_updated_at();