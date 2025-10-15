-- CRM Events Partitioning (Clean Install)
-- Drops existing partitioned table if present and recreates

-- 1. Drop existing partitioned structure if present
DROP TABLE IF EXISTS public.crm_events_partitioned CASCADE;

-- 2. Create partitioned parent table with composite primary key
CREATE TABLE public.crm_events_partitioned (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  type text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_hint jsonb,
  contact_id uuid,
  ts timestamp with time zone NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'web'::text,
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);

-- 3. Add foreign key
ALTER TABLE public.crm_events_partitioned
  ADD CONSTRAINT fk_crm_events_contact 
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.crm_events_partitioned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for crm_events_partitioned"
  ON public.crm_events_partitioned FOR ALL
  USING (tenant_id = COALESCE(app.current_tenant_id(), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(app.current_tenant_id(), auth.uid()));

-- 5. Create monthly partitions (Oct 2025 - Mar 2026)
CREATE TABLE public.crm_events_2025_10
  PARTITION OF public.crm_events_partitioned
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE public.crm_events_2025_11
  PARTITION OF public.crm_events_partitioned
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE public.crm_events_2025_12
  PARTITION OF public.crm_events_partitioned
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE public.crm_events_2026_01
  PARTITION OF public.crm_events_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE public.crm_events_2026_02
  PARTITION OF public.crm_events_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE public.crm_events_2026_03
  PARTITION OF public.crm_events_partitioned
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Default partition for out-of-range dates
CREATE TABLE public.crm_events_default
  PARTITION OF public.crm_events_partitioned DEFAULT;

-- 6. Create indexes on parent (cascade to all partitions)
CREATE INDEX idx_crm_events_p_tenant_ts 
  ON public.crm_events_partitioned (tenant_id, ts DESC);
  
CREATE INDEX idx_crm_events_p_type 
  ON public.crm_events_partitioned (tenant_id, type, ts DESC);
  
CREATE INDEX idx_crm_events_p_contact 
  ON public.crm_events_partitioned (tenant_id, contact_id, ts DESC) 
  WHERE contact_id IS NOT NULL;
  
CREATE INDEX idx_crm_events_p_idemkey 
  ON public.crm_events_partitioned ((props->>'idemKey')) 
  WHERE props ? 'idemKey';

-- 7. Monthly partition maintenance helper
CREATE OR REPLACE FUNCTION app.ensure_next_crm_partition() 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  start_ts date;
  end_ts date;
  partition_name text;
BEGIN
  start_ts := date_trunc('month', now() + INTERVAL '1 month')::date;
  end_ts := (start_ts + INTERVAL '1 month')::date;
  partition_name := 'crm_events_' || to_char(start_ts, 'YYYY_MM');
  
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.crm_events_partitioned FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_ts, end_ts
  );
END $$;

GRANT EXECUTE ON FUNCTION app.ensure_next_crm_partition() TO service_role;