#!/bin/bash
# Production Readiness Audit Script
# Run all verification checks and generate report

set -e

echo "🔍 Production Readiness Audit"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

# ============================================
# 1. Legacy Role Keys Check
# ============================================
echo "1️⃣  Checking for legacy role keys..."
if grep -R "['\"]\(user\|admin\|super\|knower\|super_rocker\)['\"]" \
  src supabase/functions 2>/dev/null | grep -v -E "type|docs|migrations|spec|test" | grep -v "node_modules"; then
  echo -e "${RED}❌ FAIL: Legacy role keys found${NC}"
  FAIL=$((FAIL + 1))
else
  echo -e "${GREEN}✅ PASS: No legacy role keys${NC}"
  PASS=$((PASS + 1))
fi
echo ""

# ============================================
# 2. Raw DB Access Check
# ============================================
echo "2️⃣  Checking for raw DB access..."
RAW_DB_COUNT=$(grep -R "supabase\.from\(" supabase/functions src 2>/dev/null | \
  grep -v "tenantClient" | grep -v "adminClient" | grep -v "node_modules" | wc -l)

if [ "$RAW_DB_COUNT" -gt 0 ]; then
  echo -e "${RED}❌ FAIL: $RAW_DB_COUNT raw DB calls found${NC}"
  echo "   First 5:"
  grep -R "supabase\.from\(" supabase/functions src 2>/dev/null | \
    grep -v "tenantClient" | grep -v "adminClient" | grep -v "node_modules" | head -5
  FAIL=$((FAIL + 1))
else
  echo -e "${GREEN}✅ PASS: All DB calls use tenant guards${NC}"
  PASS=$((PASS + 1))
fi
echo ""

# ============================================
# 3. Web TTS Check
# ============================================
echo "3️⃣  Checking for web TTS usage..."
WEB_TTS_COUNT=$(grep -R "speechSynthesis\|SpeechSynthesisUtterance" src 2>/dev/null | \
  grep -v "node_modules" | wc -l)

if [ "$WEB_TTS_COUNT" -gt 0 ]; then
  echo -e "${RED}❌ FAIL: Web TTS found (should be server-only)${NC}"
  FAIL=$((FAIL + 1))
else
  echo -e "${GREEN}✅ PASS: TTS is server-only${NC}"
  PASS=$((PASS + 1))
fi
echo ""

# ============================================
# 4. Search Isolation Check
# ============================================
echo "4️⃣  Checking search isolation..."
if grep -R "searchPrivate\|searchMarket" supabase/functions 2>/dev/null | grep -v "node_modules"; then
  echo -e "${GREEN}✅ PASS: Dual search indices found${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}❌ FAIL: No dual search index implementation${NC}"
  FAIL=$((FAIL + 1))
fi
echo ""

# ============================================
# 5. Job Queue Check
# ============================================
echo "5️⃣  Checking job queue infrastructure..."
if grep -R "ingest_jobs\|job_queue" supabase 2>/dev/null | grep -v "node_modules"; then
  echo -e "${GREEN}✅ PASS: Job queue found${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}❌ FAIL: No job queue infrastructure${NC}"
  FAIL=$((FAIL + 1))
fi
echo ""

# ============================================
# 6. Rate Limiting Check
# ============================================
echo "6️⃣  Checking rate limiting coverage..."
RATE_LIMIT_COUNT=$(grep -R "withRateLimit\|rateLimit" supabase/functions 2>/dev/null | \
  grep -v "node_modules" | wc -l)

if [ "$RATE_LIMIT_COUNT" -gt 10 ]; then
  echo -e "${GREEN}✅ PASS: Rate limiting widely used ($RATE_LIMIT_COUNT occurrences)${NC}"
  PASS=$((PASS + 1))
elif [ "$RATE_LIMIT_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  WARN: Rate limiting exists but coverage incomplete${NC}"
  WARN=$((WARN + 1))
else
  echo -e "${RED}❌ FAIL: No rate limiting found${NC}"
  FAIL=$((FAIL + 1))
fi
echo ""

# ============================================
# 7. Tenant Guard Usage Check
# ============================================
echo "7️⃣  Checking tenant guard usage..."
TENANT_GUARD_COUNT=$(grep -R "withTenantGuard" supabase/functions 2>/dev/null | \
  grep -v "node_modules" | wc -l)

if [ "$TENANT_GUARD_COUNT" -gt 30 ]; then
  echo -e "${GREEN}✅ PASS: Tenant guards widely used ($TENANT_GUARD_COUNT occurrences)${NC}"
  PASS=$((PASS + 1))
elif [ "$TENANT_GUARD_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  WARN: Tenant guards exist but not on all functions${NC}"
  WARN=$((WARN + 1))
else
  echo -e "${RED}❌ FAIL: No tenant guards found${NC}"
  FAIL=$((FAIL + 1))
fi
echo ""

# ============================================
# 8. Observability Check
# ============================================
echo "8️⃣  Checking observability..."
if grep -R "request_id\|org_id.*actor_role" supabase/functions 2>/dev/null | \
  grep -v "node_modules" | head -1 > /dev/null; then
  echo -e "${YELLOW}⚠️  WARN: Some observability exists, but incomplete${NC}"
  WARN=$((WARN + 1))
else
  echo -e "${RED}❌ FAIL: No structured observability${NC}"
  FAIL=$((FAIL + 1))
fi
echo ""

# ============================================
# 9. Test Coverage Check
# ============================================
echo "9️⃣  Checking for tenant leak tests..."
if [ -f "tests/integration/tenant-isolation.test.ts" ]; then
  echo -e "${GREEN}✅ PASS: Tenant isolation tests exist${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}❌ FAIL: No tenant isolation tests${NC}"
  FAIL=$((FAIL + 1))
fi
echo ""

# ============================================
# 10. RLS Verification
# ============================================
echo "🔟 Checking RLS verification script..."
if [ -f "scripts/audit/verify-rls.sql" ]; then
  echo -e "${GREEN}✅ PASS: RLS verification script exists${NC}"
  echo "   Run it manually against your database:"
  echo "   psql \$DATABASE_URL -f scripts/audit/verify-rls.sql"
  PASS=$((PASS + 1))
else
  echo -e "${YELLOW}⚠️  WARN: RLS verification script missing${NC}"
  WARN=$((WARN + 1))
fi
echo ""

# ============================================
# Summary
# ============================================
echo "================================"
echo "📊 Audit Summary"
echo "================================"
echo -e "${GREEN}✅ PASSED: $PASS${NC}"
echo -e "${YELLOW}⚠️  WARNINGS: $WARN${NC}"
echo -e "${RED}❌ FAILED: $FAIL${NC}"
echo ""

if [ "$FAIL" -eq 0 ] && [ "$WARN" -eq 0 ]; then
  echo -e "${GREEN}🎉 Production Ready!${NC}"
  exit 0
elif [ "$FAIL" -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Minor issues - Review warnings${NC}"
  exit 0
else
  echo -e "${RED}🛑 NOT Production Ready - Fix critical issues${NC}"
  exit 1
fi
