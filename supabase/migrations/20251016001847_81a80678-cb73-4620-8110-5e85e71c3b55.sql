
-- Create current and next month partitions for crm_events_v2
DO $$
DECLARE
  current_month TEXT := TO_CHAR(CURRENT_DATE, 'YYYY_MM');
  next_month TEXT := TO_CHAR(CURRENT_DATE + INTERVAL '1 month', 'YYYY_MM');
  current_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  current_end DATE := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
  next_start DATE := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
  next_end DATE := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '2 months');
BEGIN
  -- Create current month partition
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.crm_events_%s PARTITION OF public.crm_events_v2 
     FOR VALUES FROM (%L) TO (%L)',
    current_month, current_start, current_end
  );
  
  -- Create next month partition
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.crm_events_%s PARTITION OF public.crm_events_v2 
     FOR VALUES FROM (%L) TO (%L)',
    next_month, next_start, next_end
  );
  
  RAISE NOTICE 'Created partitions: crm_events_% and crm_events_%', current_month, next_month;
END $$;
