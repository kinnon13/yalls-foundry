-- PR-S1 PART 3 (Fixed): Add policies for CRM partitions using correct columns

-- ========================================
-- CRM EVENT PARTITION POLICIES (use tenant_id)
-- ========================================

-- Old partition schema uses tenant_id
CREATE POLICY crm_events_2025_10_tenant ON public.crm_events_2025_10
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY crm_events_2025_10_v2_tenant ON public.crm_events_2025_10_v2
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY crm_events_2025_11_tenant ON public.crm_events_2025_11
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY crm_events_2025_11_v2_tenant ON public.crm_events_2025_11_v2
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY crm_events_2025_12_tenant ON public.crm_events_2025_12
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY crm_events_2025_12_v2_tenant ON public.crm_events_2025_12_v2
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY crm_events_2026_01_tenant ON public.crm_events_2026_01
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY crm_events_2026_02_tenant ON public.crm_events_2026_02
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY crm_events_2026_03_tenant ON public.crm_events_2026_03
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY crm_events_default_tenant ON public.crm_events_default
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Admin bypass for all CRM partitions
DO $$
DECLARE
  partition_name TEXT;
BEGIN
  FOR partition_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE 'crm_events_%'
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin'')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin''))',
      partition_name || '_admin',
      partition_name
    );
  END LOOP;
END $$;