
-- CUTOVER: Swap crm_events (v1) with crm_events_v2 (partitioned)
BEGIN;

-- Drop the dual-write trigger (no longer needed after swap)
DROP TRIGGER IF EXISTS mirror_to_v2 ON public.crm_events;

-- Atomic swap: rename old table to backup, new table to primary
ALTER TABLE public.crm_events RENAME TO crm_events_old;
ALTER TABLE public.crm_events_v2 RENAME TO crm_events;

-- Verify the swap
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'crm_events' AND relkind = 'p') THEN
    RAISE NOTICE '✅ Cutover complete - crm_events is now partitioned';
  ELSE
    RAISE EXCEPTION '❌ Cutover failed - crm_events is not partitioned';
  END IF;
END $$;

COMMIT;
