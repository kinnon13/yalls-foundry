-- CRM Events Partitioning (Dual-Write Zero-Downtime Strategy)
-- Creates v2 partitioned table with dual-write trigger for safe cutover

-- 1. Create v2 partitioned table (RANGE on ts, PK includes partition key)
CREATE TABLE IF NOT EXISTS public.crm_events_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  type text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_id uuid,
  contact_hint jsonb,
  anonymous_id text,
  source text NOT NULL DEFAULT 'web',
  ts timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);

-- 2. RLS parity with original table
ALTER TABLE public.crm_events_v2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for crm_events_v2" ON public.crm_events_v2;
CREATE POLICY "Tenant isolation for crm_events_v2"
  ON public.crm_events_v2 FOR ALL
  USING (tenant_id = COALESCE(app.current_tenant_id(), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(app.current_tenant_id(), auth.uid()));

-- 3. Index parity
CREATE INDEX IF NOT EXISTS idx_crm_events_v2_tenant_ts ON public.crm_events_v2(tenant_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_crm_events_v2_type ON public.crm_events_v2(tenant_id, type, ts DESC);
CREATE INDEX IF NOT EXISTS idx_crm_events_v2_contact ON public.crm_events_v2(tenant_id, contact_id, ts DESC) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_events_v2_idemkey ON public.crm_events_v2 ((props->>'idemKey')) WHERE props ? 'idemKey';

-- 4. Create partitions (current + next month)
DO $$
DECLARE s date; e date; pname text;
BEGIN
  FOR s IN SELECT date_trunc('month', now())::date
            UNION SELECT date_trunc('month', now() + interval '1 month')::date
  LOOP
    e := (s + interval '1 month')::date;
    pname := 'crm_events_' || to_char(s,'YYYY_MM');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.crm_events_v2 FOR VALUES FROM (%L) TO (%L)',
      pname, s, e
    );
  END LOOP;
END $$;

-- 5. Monthly partition maintenance helper
CREATE OR REPLACE FUNCTION app.ensure_next_crm_partition() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s date; e date; pname text;
BEGIN
  s := date_trunc('month', now() + interval '1 month')::date;
  e := (s + interval '1 month')::date;
  pname := 'crm_events_' || to_char(s,'YYYY_MM');
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.crm_events_v2 FOR VALUES FROM (%L) TO (%L)',
    pname, s, e
  );
END $$;
GRANT EXECUTE ON FUNCTION app.ensure_next_crm_partition() TO service_role;

-- 6. Dual-write trigger (mirror new inserts from v1 → v2)
CREATE OR REPLACE FUNCTION app.crmevents_mirror_to_v2()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.crm_events_v2
    (id, tenant_id, type, props, contact_id, contact_hint, anonymous_id, source, ts, created_at)
  VALUES
    (COALESCE(NEW.id, gen_random_uuid()), NEW.tenant_id, NEW.type, NEW.props, NEW.contact_id,
     NEW.contact_hint, NEW.anonymous_id, NEW.source, NEW.ts, COALESCE(NEW.created_at, now()))
  ON CONFLICT (id, ts) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS mirror_to_v2 ON public.crm_events;
CREATE TRIGGER mirror_to_v2
BEFORE INSERT ON public.crm_events
FOR EACH ROW EXECUTE FUNCTION app.crmevents_mirror_to_v2();

COMMENT ON TABLE public.crm_events_v2 IS
'Partitioned CRM events (v2). Dual-write from v1 is active.

BACKFILL (run in chunks until remaining=0):
INSERT INTO public.crm_events_v2 (id, tenant_id, type, props, contact_id, contact_hint, anonymous_id, source, ts, created_at)
SELECT id, tenant_id, type, props, contact_id, contact_hint, anonymous_id, source, ts, created_at
FROM public.crm_events
WHERE ts < now() - interval ''5 minutes''
ORDER BY ts
LIMIT 100000
ON CONFLICT (id, ts) DO NOTHING;

PROGRESS CHECK:
SELECT (SELECT COUNT(*) FROM public.crm_events) - (SELECT COUNT(*) FROM public.crm_events_v2) AS remaining;

CUTOVER (brief lock):
BEGIN;
SELECT app.ensure_next_crm_partition();
LOCK TABLE public.crm_events IN ACCESS EXCLUSIVE MODE;
DROP TRIGGER IF EXISTS mirror_to_v2 ON public.crm_events;
INSERT INTO public.crm_events_v2 (id, tenant_id, type, props, contact_id, contact_hint, anonymous_id, source, ts, created_at)
SELECT id, tenant_id, type, props, contact_id, contact_hint, anonymous_id, source, ts, created_at
FROM public.crm_events
WHERE (id, ts) NOT IN (SELECT id, ts FROM public.crm_events_v2)
ON CONFLICT (id, ts) DO NOTHING;
ALTER TABLE public.crm_events RENAME TO crm_events_old;
ALTER TABLE public.crm_events_v2 RENAME TO crm_events;
COMMIT;

VERIFY:
SELECT (SELECT COUNT(*) FROM public.crm_events) AS v2_count, (SELECT COUNT(*) FROM public.crm_events_old) AS v1_count;

CLEANUP (after validation):
DROP TABLE public.crm_events_old;';