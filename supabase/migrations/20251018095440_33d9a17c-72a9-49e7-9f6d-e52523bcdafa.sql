-- Dashboard RLS Policies Fix
-- Ensures users can access their pins, folders, and related data

-- user_pins table
ALTER TABLE IF EXISTS public.user_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_pins_select ON public.user_pins;
CREATE POLICY user_pins_select ON public.user_pins
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_pins_insert ON public.user_pins;
CREATE POLICY user_pins_insert ON public.user_pins
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_pins_update ON public.user_pins;
CREATE POLICY user_pins_update ON public.user_pins
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_pins_delete ON public.user_pins;
CREATE POLICY user_pins_delete ON public.user_pins
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- user_pin_folders table
ALTER TABLE IF EXISTS public.user_pin_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_pin_folders_select ON public.user_pin_folders;
CREATE POLICY user_pin_folders_select ON public.user_pin_folders
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_pin_folders_insert ON public.user_pin_folders;
CREATE POLICY user_pin_folders_insert ON public.user_pin_folders
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_pin_folders_update ON public.user_pin_folders;
CREATE POLICY user_pin_folders_update ON public.user_pin_folders
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_pin_folders_delete ON public.user_pin_folders;
CREATE POLICY user_pin_folders_delete ON public.user_pin_folders
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- installed_apps table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'installed_apps') THEN
    ALTER TABLE public.installed_apps ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS ia_owner_select ON public.installed_apps;
    CREATE POLICY ia_owner_select ON public.installed_apps
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.entities e
        WHERE e.id = installed_apps.entity_id
          AND e.owner_user_id = auth.uid()
      )
    );
  END IF;
END$$;