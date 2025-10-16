
-- Create October 2025 partition on crm_events_v2
CREATE TABLE IF NOT EXISTS public.crm_events_2025_10_v2 
PARTITION OF public.crm_events_v2
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- Create November 2025 partition on crm_events_v2
CREATE TABLE IF NOT EXISTS public.crm_events_2025_11_v2
PARTITION OF public.crm_events_v2
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Create December 2025 partition on crm_events_v2  
CREATE TABLE IF NOT EXISTS public.crm_events_2025_12_v2
PARTITION OF public.crm_events_v2
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
