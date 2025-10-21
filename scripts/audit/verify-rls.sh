#!/bin/bash
# Wrapper to run RLS verification against staging DB

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$STAGING_DB" ]; then
  echo -e "${YELLOW}⚠️  STAGING_DB not set. Skipping RLS verification.${NC}"
  exit 0
fi

echo -e "${GREEN}🔍 Verifying RLS policies on staging DB...${NC}"
echo ""

# Run the SQL verification script
psql "$STAGING_DB" -f scripts/audit/verify-rls.sql > rls-report.txt 2>&1

# Check for failures in output
if grep -q "FAIL:" rls-report.txt; then
  echo -e "${RED}❌ RLS verification failed:${NC}"
  cat rls-report.txt
  rm rls-report.txt
  exit 1
fi

if grep -q "WARN:" rls-report.txt; then
  echo -e "${YELLOW}⚠️  RLS warnings found:${NC}"
  cat rls-report.txt
  echo ""
  echo -e "${YELLOW}Fix warnings before merging to main${NC}"
fi

echo -e "${GREEN}✅ RLS verification passed${NC}"
rm rls-report.txt
