#!/bin/bash
# Check that all edge functions use tenant guards

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Checking tenant guard usage in edge functions..."
echo ""

FAILURES=0

# 1) Check for raw DB calls without guards
echo "1️⃣  Checking for raw DB calls..."
RAW_CALLS=$(grep -R "supabase\.from\(" supabase/functions --include="*.ts" | grep -v "tenantGuard" | grep -v "_shared" | grep -v "adminClient" || true)

if [ -n "$RAW_CALLS" ]; then
  echo -e "${RED}❌ Found raw DB calls without tenant guards:${NC}"
  echo "$RAW_CALLS"
  FAILURES=$((FAILURES + 1))
else
  echo -e "${GREEN}✅ No raw DB calls found${NC}"
fi
echo ""

# 2) Check that functions import withTenantGuard
echo "2️⃣  Checking tenant guard imports..."
MISSING_IMPORTS=0

for file in supabase/functions/*/index.ts; do
  # Skip _shared and workers
  if [[ "$file" == *"_shared"* ]] || [[ "$file" == *"workers"* ]]; then
    continue
  fi
  
  if ! grep -q "withTenantGuard" "$file"; then
    echo -e "${YELLOW}⚠️  Missing withTenantGuard import: $file${NC}"
    MISSING_IMPORTS=$((MISSING_IMPORTS + 1))
    FAILURES=$((FAILURES + 1))
  fi
done

if [ $MISSING_IMPORTS -eq 0 ]; then
  echo -e "${GREEN}✅ All functions import withTenantGuard${NC}"
fi
echo ""

# 3) Check for legacy role keys
echo "3️⃣  Checking for legacy role keys..."
LEGACY_ROLES=$(grep -R "['\"]\(user\|admin\|super\|knower\|super_rocker\)['\"]" supabase/functions --include="*.ts" | grep -v -E "type|ActorRole|_shared" || true)

if [ -n "$LEGACY_ROLES" ]; then
  echo -e "${YELLOW}⚠️  Found potential legacy role keys:${NC}"
  echo "$LEGACY_ROLES"
  FAILURES=$((FAILURES + 1))
else
  echo -e "${GREEN}✅ No legacy role keys found${NC}"
fi
echo ""

# Summary
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All tenant guard checks passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Found $FAILURES issue(s). Fix before deploying.${NC}"
  exit 1
fi
