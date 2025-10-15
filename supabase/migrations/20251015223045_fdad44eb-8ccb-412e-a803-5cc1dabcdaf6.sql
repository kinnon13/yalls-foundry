-- Auto-partition management for crm_events
-- Note: Table conversion to partitioned must be done manually if crm_events has data

-- Function to ensure partitions exist (for use after manual partitioning)
CREATE OR REPLACE FUNCTION app.ensure_crm_event_partitions(months_ahead int DEFAULT 2)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i int;
  start_month date;
  next_month  date;
  partition_name text;
BEGIN
  FOR i IN 0..months_ahead LOOP
    start_month := date_trunc('month', now())::date + (i || ' month')::interval;
    next_month  := (start_month + interval '1 month')::date;
    partition_name := 'crm_events_' || to_char(start_month,'YYYY_MM');

    -- Only create if crm_events is already partitioned
    -- This will silently fail if table is not partitioned yet
    BEGIN
      EXECUTE format($f$
        CREATE TABLE IF NOT EXISTS public.%I
        PARTITION OF public.crm_events
        FOR VALUES FROM (%L) TO (%L)
      $f$, partition_name, start_month, next_month);
      
      RAISE NOTICE 'Created partition: %', partition_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Skipped partition % (table may not be partitioned yet): %', partition_name, SQLERRM;
    END;
  END LOOP;
END$$;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION app.ensure_crm_event_partitions(int) TO service_role;

-- Add comment with manual conversion steps
COMMENT ON FUNCTION app.ensure_crm_event_partitions IS 
'Auto-creates monthly partitions for crm_events. 
To enable:
1. Enable pg_cron extension in Supabase dashboard
2. Convert table: CREATE TABLE crm_events_new (LIKE crm_events INCLUDING ALL) PARTITION BY RANGE (ts);
3. Migrate data: INSERT INTO crm_events_new SELECT * FROM crm_events;
4. Swap tables: DROP TABLE crm_events; ALTER TABLE crm_events_new RENAME TO crm_events;
5. Create partitions: SELECT app.ensure_crm_event_partitions(3);
6. Schedule: SELECT cron.schedule(''ensure-partitions'', ''5 1 * * *'', $$SELECT app.ensure_crm_event_partitions(3);$$);';