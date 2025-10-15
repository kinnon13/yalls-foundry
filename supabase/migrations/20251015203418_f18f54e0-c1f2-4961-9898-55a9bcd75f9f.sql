-- Add normalized_name for deduplication
ALTER TABLE entity_profiles ADD COLUMN IF NOT EXISTS normalized_name text;

-- Populate existing rows
UPDATE entity_profiles 
SET normalized_name = LOWER(TRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')))
WHERE normalized_name IS NULL;

-- Performance indexes (no unique constraint due to partitioning)
CREATE INDEX IF NOT EXISTS idx_entity_profiles_norm ON entity_profiles(entity_type, normalized_name, created_at);
CREATE INDEX IF NOT EXISTS idx_entity_created_at ON entity_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entity_claimed ON entity_profiles(is_claimed);

-- Search optimization with trigram
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS gin_entity_name_trgm ON entity_profiles USING gin (name gin_trgm_ops);

-- Business index for unclaimed queries
CREATE INDEX IF NOT EXISTS idx_business_owner_null ON businesses(owner_id) WHERE owner_id IS NULL;

-- Audit log for entity ingestion (no FK constraint due to partitioned table)
CREATE TABLE IF NOT EXISTS entity_ingest_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unknown_memory_id uuid,
  entity_id uuid,
  action text CHECK (action IN ('created', 'skipped', 'merged', 'duplicate')),
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  by_user_id uuid
);

CREATE INDEX IF NOT EXISTS idx_ingest_log_created ON entity_ingest_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_log_action ON entity_ingest_log(action);
CREATE INDEX IF NOT EXISTS idx_ingest_log_entity ON entity_ingest_log(entity_id);

-- RLS for audit log
ALTER TABLE entity_ingest_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ingest log" ON entity_ingest_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert ingest log" ON entity_ingest_log
  FOR INSERT WITH CHECK (true);