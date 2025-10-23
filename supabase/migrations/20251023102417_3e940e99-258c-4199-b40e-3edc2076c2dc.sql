
-- EMERGENCY SECURITY FIX: Enable RLS on ALL ai_* tables

DO $$
DECLARE
    t record;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename LIKE 'ai_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
        
        -- Default deny all
        EXECUTE format('DROP POLICY IF EXISTS "default_deny_%s" ON public.%I', t.tablename, t.tablename);
        EXECUTE format('CREATE POLICY "default_deny_%s" ON public.%I FOR ALL USING (false) WITH CHECK (false)', t.tablename, t.tablename);
        
        -- Service role can do anything (for Andy)
        EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%s" ON public.%I', t.tablename, t.tablename);
        EXECUTE format('CREATE POLICY "service_role_all_%s" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t.tablename, t.tablename);
        
        -- If table has tenant_id, allow tenant access
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = t.tablename 
              AND column_name = 'tenant_id'
        ) THEN
            EXECUTE format('DROP POLICY IF EXISTS "tenant_access_%s" ON public.%I', t.tablename, t.tablename);
            EXECUTE format('CREATE POLICY "tenant_access_%s" ON public.%I FOR ALL TO authenticated USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid())', t.tablename, t.tablename);
        END IF;
        
        -- If table has user_id, allow user access
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = t.tablename 
              AND column_name = 'user_id'
        ) THEN
            EXECUTE format('DROP POLICY IF EXISTS "user_access_%s" ON public.%I', t.tablename, t.tablename);
            EXECUTE format('CREATE POLICY "user_access_%s" ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t.tablename, t.tablename);
        END IF;
    END LOOP;
END $$;

-- Fix ai_monitoring to allow user access for brain monitor
ALTER TABLE public.ai_monitoring ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "monitor_public_read" ON public.ai_monitoring;
CREATE POLICY "monitor_public_read" ON public.ai_monitoring FOR SELECT TO authenticated USING (true);
