-- Performance optimization: Add indexes for better query performance

-- Partial indexes for unclaimed entities (huge win for filtered queries)
CREATE INDEX IF NOT EXISTS idx_profiles_unclaimed 
  ON entity_profiles(created_at DESC) 
  WHERE claimed_by IS NULL;

-- Composite indexes for common sorts (keyset pagination ready)
CREATE INDEX IF NOT EXISTS idx_entity_profiles_composite 
  ON entity_profiles(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_businesses_composite 
  ON businesses(created_at DESC, id DESC);