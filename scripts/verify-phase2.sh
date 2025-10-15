#!/bin/bash
# Phase 2 Verification Script
# Validates all scaling readiness requirements

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Phase 2 Verification"
echo "======================="
echo ""

# Track failures
FAILURES=0

# 1. Hardcoded Tenant IDs
echo "1️⃣  Checking for hardcoded tenant IDs..."
if git grep -n "00000000-0000-0000-0000-000000000000" 2>/dev/null | grep -v "test" | grep -v "GLOBAL_TENANT_ID"; then
  echo -e "${RED}❌ Found hardcoded tenant IDs${NC}"
  FAILURES=$((FAILURES+1))
else
  echo -e "${GREEN}✅ No hardcoded tenant IDs${NC}"
fi
echo ""

# 2. Rate Limiting Coverage
echo "2️⃣  Checking rate limiting coverage..."
MISSING_RL=$(find supabase/functions -name "index.ts" -type f | while read file; do
  if ! grep -q "withRateLimit(" "$file"; then
    echo "$file"
  fi
done)

if [ -z "$MISSING_RL" ]; then
  echo -e "${GREEN}✅ All edge functions have rate limiting${NC}"
else
  echo -e "${RED}❌ Missing rate limits in:${NC}"
  echo "$MISSING_RL"
  FAILURES=$((FAILURES+1))
fi
echo ""

# 3. Console Logging in Edge Functions
echo "3️⃣  Checking for console.* in edge functions..."
if git grep -n "console\.\(log\|warn\|error\)" supabase/functions/ 2>/dev/null | grep -v "// console" | grep -v "/\*"; then
  echo -e "${YELLOW}⚠️  Found console.* calls (should use structured logging)${NC}"
  FAILURES=$((FAILURES+1))
else
  echo -e "${GREEN}✅ No raw console calls in edge functions${NC}"
fi
echo ""

# 4. 200-Line Rule
echo "4️⃣  Checking 200-line rule..."
LONG_FILES=$(find src supabase/functions -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt 200 ]; then
    echo "$file: $lines lines"
  fi
done)

if [ -z "$LONG_FILES" ]; then
  echo -e "${GREEN}✅ All files under 200 lines${NC}"
else
  echo -e "${YELLOW}⚠️  Files over 200 lines:${NC}"
  echo "$LONG_FILES"
  FAILURES=$((FAILURES+1))
fi
echo ""

# 5. Verify ingest_event usage (not direct resolve_contact)
echo "5️⃣  Checking RPC usage patterns..."
DIRECT_RESOLVE=$(git grep -n "rpc('app.resolve_contact'" 2>/dev/null | wc -l)
INGEST_CALLS=$(git grep -n "rpc('app.ingest_event'" 2>/dev/null | wc -l)

echo "   - Direct resolve_contact calls: $DIRECT_RESOLVE"
echo "   - ingest_event calls: $INGEST_CALLS"

if [ "$DIRECT_RESOLVE" -eq 0 ]; then
  echo -e "${GREEN}✅ No direct resolve_contact calls (using ingest_event)${NC}"
else
  echo -e "${YELLOW}⚠️  Found direct resolve_contact calls (should use ingest_event)${NC}"
fi
echo ""

# 6. TypeScript Build
echo "6️⃣  Running TypeScript build..."
if pnpm build > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Build successful${NC}"
else
  echo -e "${RED}❌ Build failed${NC}"
  FAILURES=$((FAILURES+1))
fi
echo ""

# Summary
echo "======================="
echo "📊 Verification Summary"
echo "======================="
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Ready for scale.${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILURES check(s) failed. Review output above.${NC}"
  exit 1
fi
