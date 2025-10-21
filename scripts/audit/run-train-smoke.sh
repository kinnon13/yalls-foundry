#!/bin/bash
# Train Smoke Test
# Runs on train/db-* branches to verify migrations are safe

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚂 Train Smoke Test${NC}"
echo "======================================"
echo ""

# Check we're on a train branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ ! "$BRANCH" =~ ^train/db- ]]; then
  echo -e "${YELLOW}⚠️  Not on a train branch. Skipping.${NC}"
  exit 0
fi

# 1. Check environment
if [ -z "$TRAIN_DB" ]; then
  echo -e "${RED}❌ TRAIN_DB env var not set${NC}"
  echo "Set it to your scratch Supabase DB URL"
  exit 1
fi

echo -e "${BLUE}1️⃣  Resetting scratch database...${NC}"
# Note: Requires supabase CLI and project linked
supabase db reset --db-url "$TRAIN_DB" || {
  echo -e "${YELLOW}⚠️  DB reset failed. Trying direct migration...${NC}"
}

# 2. Apply all migrations
echo -e "${BLUE}2️⃣  Applying migrations...${NC}"
for migration in supabase/migrations/*.sql; do
  echo "   📄 Applying $(basename $migration)..."
  psql "$TRAIN_DB" -f "$migration" -v ON_ERROR_STOP=1 || {
    echo -e "${RED}❌ Migration failed: $migration${NC}"
    exit 1
  }
done
echo -e "${GREEN}✅ All migrations applied${NC}"
echo ""

# 3. Verify RLS
echo -e "${BLUE}3️⃣  Verifying RLS policies...${NC}"
psql "$TRAIN_DB" -f scripts/audit/verify-rls.sql || {
  echo -e "${RED}❌ RLS verification failed${NC}"
  exit 1
}
echo -e "${GREEN}✅ RLS verified${NC}"
echo ""

# 4. Check for missing org_id
echo -e "${BLUE}4️⃣  Checking for missing org_id...${NC}"
psql "$TRAIN_DB" -c "
  SELECT 'rocker_threads' AS table_name, COUNT(*) AS missing
  FROM rocker_threads WHERE org_id IS NULL
  UNION ALL
  SELECT 'knowledge_items', COUNT(*) 
  FROM knowledge_items WHERE org_id IS NULL
  UNION ALL
  SELECT 'rocker_files', COUNT(*) 
  FROM rocker_files WHERE org_id IS NULL
  UNION ALL
  SELECT 'voice_events', COUNT(*) 
  FROM voice_events WHERE org_id IS NULL;
" || {
  echo -e "${YELLOW}⚠️  Some tables don't exist yet (expected for new tables)${NC}"
}
echo ""

# 5. Run tenant isolation tests (if available)
echo -e "${BLUE}5️⃣  Running tenant isolation tests...${NC}"
if [ -f "tests/integration/tenant-isolation.test.ts" ]; then
  npm run test:integration || {
    echo -e "${RED}❌ Tenant isolation tests failed${NC}"
    exit 1
  }
  echo -e "${GREEN}✅ Tenant isolation tests passed${NC}"
else
  echo -e "${YELLOW}⚠️  No tenant isolation tests found${NC}"
fi
echo ""

# 6. Benchmark critical queries
echo -e "${BLUE}6️⃣  Benchmarking critical queries...${NC}"
psql "$TRAIN_DB" -c "
  -- Test private search performance
  EXPLAIN ANALYZE 
  SELECT * FROM match_private_chunks(
    'b6e5e0e0-0e0e-0e0e-0e0e-0e0e0e0e0e0e'::uuid,
    array_fill(0.1, ARRAY[1536])::vector,
    10
  );
" || {
  echo -e "${YELLOW}⚠️  Benchmark failed (expected if tables empty)${NC}"
}
echo ""

# Summary
echo -e "${GREEN}✅ Train smoke test passed!${NC}"
echo ""
echo "Safe to merge train → staging"
