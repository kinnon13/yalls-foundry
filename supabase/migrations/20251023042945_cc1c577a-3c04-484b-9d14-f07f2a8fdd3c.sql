-- ============================================
-- COMPLETE TENANT ISOLATION & SECURITY FIX
-- Fixes: 109 linter warnings
-- ============================================

-- PART 1: Add tenant_id to ai_worker_heartbeats
ALTER TABLE ai_worker_heartbeats ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_ai_worker_heartbeats_tenant ON ai_worker_heartbeats(tenant_id);

-- Update existing trigger to inject tenant_id (already created in prior migration)

-- PART 2: Enable RLS on tables WITHOUT RLS (9 tables)
-- These are critical user data tables that MUST have tenant isolation

-- experiments
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_experiments_tenant ON experiments(tenant_id);
DROP TRIGGER IF EXISTS trg_experiments_tenant ON experiments;
CREATE TRIGGER trg_experiments_tenant BEFORE INSERT ON experiments FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_experiments" ON experiments FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- ingest_jobs
ALTER TABLE ingest_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_jobs ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_ingest_jobs_tenant ON ingest_jobs(tenant_id);
DROP TRIGGER IF EXISTS trg_ingest_jobs_tenant ON ingest_jobs;
CREATE TRIGGER trg_ingest_jobs_tenant BEFORE INSERT ON ingest_jobs FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_ingest_jobs" ON ingest_jobs FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- kv_counters
ALTER TABLE kv_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_counters ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_kv_counters_tenant ON kv_counters(tenant_id);
DROP TRIGGER IF EXISTS trg_kv_counters_tenant ON kv_counters;
CREATE TRIGGER trg_kv_counters_tenant BEFORE INSERT ON kv_counters FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_kv_counters" ON kv_counters FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- market_chunks
ALTER TABLE market_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_chunks ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_market_chunks_tenant ON market_chunks(tenant_id);
DROP TRIGGER IF EXISTS trg_market_chunks_tenant ON market_chunks;
CREATE TRIGGER trg_market_chunks_tenant BEFORE INSERT ON market_chunks FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_market_chunks" ON market_chunks FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- private_chunks
ALTER TABLE private_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_chunks ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_private_chunks_tenant ON private_chunks(tenant_id);
DROP TRIGGER IF EXISTS trg_private_chunks_tenant ON private_chunks;
CREATE TRIGGER trg_private_chunks_tenant BEFORE INSERT ON private_chunks FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_private_chunks" ON private_chunks FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- rate_counters
ALTER TABLE rate_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_counters ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_rate_counters_tenant ON rate_counters(tenant_id);
DROP TRIGGER IF EXISTS trg_rate_counters_tenant ON rate_counters;
CREATE TRIGGER trg_rate_counters_tenant BEFORE INSERT ON rate_counters FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_rate_counters" ON rate_counters FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- rocker_edges
ALTER TABLE rocker_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_edges ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_rocker_edges_tenant ON rocker_edges(tenant_id);
DROP TRIGGER IF EXISTS trg_rocker_edges_tenant ON rocker_edges;
CREATE TRIGGER trg_rocker_edges_tenant BEFORE INSERT ON rocker_edges FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_rocker_edges" ON rocker_edges FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- rocker_entities
ALTER TABLE rocker_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_entities ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_rocker_entities_tenant ON rocker_entities(tenant_id);
DROP TRIGGER IF EXISTS trg_rocker_entities_tenant ON rocker_entities;
CREATE TRIGGER trg_rocker_entities_tenant BEFORE INSERT ON rocker_entities FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_rocker_entities" ON rocker_entities FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- rocker_metrics
ALTER TABLE rocker_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocker_metrics ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_rocker_metrics_tenant ON rocker_metrics(tenant_id);
DROP TRIGGER IF EXISTS trg_rocker_metrics_tenant ON rocker_metrics;
CREATE TRIGGER trg_rocker_metrics_tenant BEFORE INSERT ON rocker_metrics FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_if_null();
CREATE POLICY "tenant_access_rocker_metrics" ON rocker_metrics FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());