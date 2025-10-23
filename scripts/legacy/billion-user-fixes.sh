#!/bin/bash
# Billion-User Quality Fixes
# Automates critical code-level improvements

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Billion-User Quality Fixes${NC}"
echo "====================================="
echo ""

FIXES_APPLIED=0
WARNINGS=0

# ============================================================================
# 1. Fix Hardcoded Tenant IDs
# ============================================================================

echo -e "${YELLOW}1️⃣  Fixing hardcoded tenant IDs...${NC}"

# Find all hardcoded tenant GUIDs in edge functions (excluding tests and constants)
HARDCODED_FILES=$(git grep -l "00000000-0000-0000-0000-000000000000" supabase/functions/ | \
  grep -v "_shared" | \
  grep -v "test" | \
  grep -v "spec" || echo "")

if [ -z "$HARDCODED_FILES" ]; then
  echo -e "${GREEN}✅ No hardcoded tenant IDs found${NC}"
else
  echo -e "${YELLOW}Found hardcoded tenant IDs in:${NC}"
  echo "$HARDCODED_FILES"
  
  # Replace with proper tenant resolution
  for file in $HARDCODED_FILES; do
    if grep -q "getTenantFromJWT" "$file"; then
      # Already has tenant resolution, just replace the hardcoded value
      sed -i.bak "s/'00000000-0000-0000-0000-000000000000'/getTenantFromJWT(req) ?? auth.uid()/g" "$file"
      echo -e "${GREEN}  ✓ Fixed: $file${NC}"
      FIXES_APPLIED=$((FIXES_APPLIED+1))
    else
      echo -e "${YELLOW}  ⚠ Manual review needed: $file (missing getTenantFromJWT import)${NC}"
      WARNINGS=$((WARNINGS+1))
    fi
  done
fi

echo ""

# ============================================================================
# 2. Enforce Rate Limiting on All Edge Functions
# ============================================================================

echo -e "${YELLOW}2️⃣  Enforcing rate limiting...${NC}"

# Find functions without rate limiting
UNPROTECTED=$(git grep -l "Deno.serve" supabase/functions/*/index.ts | while read file; do
  if ! grep -q "withRateLimit" "$file"; then
    echo "$file"
  fi
done)

if [ -z "$UNPROTECTED" ]; then
  echo -e "${GREEN}✅ All edge functions have rate limiting${NC}"
else
  echo -e "${YELLOW}Edge functions without rate limiting:${NC}"
  echo "$UNPROTECTED"
  WARNINGS=$((WARNINGS+1))
  echo ""
  echo -e "${YELLOW}Add this pattern to each function:${NC}"
  echo ""
  echo "import { withRateLimit, RateLimits } from '../_shared/rate-limit-wrapper.ts';"
  echo ""
  echo "Deno.serve(async (req) => {"
  echo "  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });"
  echo "  "
  echo "  const limited = await withRateLimit(req, 'function-name', RateLimits.standard);"
  echo "  if (limited) return limited;"
  echo "  ..."
  echo "});"
fi

echo ""

# ============================================================================
# 3. Check Console.log Usage
# ============================================================================

echo -e "${YELLOW}3️⃣  Checking for raw console logging...${NC}"

RAW_CONSOLE_COUNT=$(git grep -n "console\.\(log\|warn\|error\)" supabase/functions/ | \
  grep -v "_shared" | \
  grep -v "JSON.stringify" | \
  wc -l)

if [ "$RAW_CONSOLE_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅ All logging uses structured format${NC}"
else
  echo -e "${YELLOW}⚠️  Found $RAW_CONSOLE_COUNT raw console calls${NC}"
  echo ""
  echo "Replace with structured logging:"
  echo ""
  echo "// PII-safe structured logger"
  echo "function log(level: 'info' | 'error', msg: string, fields?: Record<string, unknown>) {"
  echo "  const payload = { lvl: level, msg, ts: new Date().toISOString(), ...fields };"
  echo "  console[level](JSON.stringify(payload));"
  echo "}"
  WARNINGS=$((WARNINGS+1))
fi

echo ""

# ============================================================================
# 4. Check File Sizes (200-line rule)
# ============================================================================

echo -e "${YELLOW}4️⃣  Checking file sizes (200-line rule)...${NC}"

LARGE_FILES=$(git ls-files 'src/**/*.ts' 'src/**/*.tsx' 'supabase/functions/**/*.ts' | \
  while read file; do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt 200 ]; then
      printf "%06d:%s\n" "$lines" "$file"
    fi
  done | sort -rn | head -20)

if [ -z "$LARGE_FILES" ]; then
  echo -e "${GREEN}✅ All files under 200 lines${NC}"
else
  echo -e "${YELLOW}Files over 200 lines (consider refactoring):${NC}"
  echo "$LARGE_FILES"
  WARNINGS=$((WARNINGS+1))
fi

echo ""

# ============================================================================
# 5. Environment Variables Check
# ============================================================================

echo -e "${YELLOW}5️⃣  Checking environment variables...${NC}"

REQUIRED_VARS=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
)

OPTIONAL_VARS=(
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
  "OPENAI_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "$var" .env 2>/dev/null; then
    echo -e "${GREEN}  ✓ $var configured${NC}"
  else
    echo -e "${RED}  ✗ $var MISSING${NC}"
    WARNINGS=$((WARNINGS+1))
  fi
done

echo ""
echo "Optional (for enhanced performance):"
for var in "${OPTIONAL_VARS[@]}"; do
  if grep -q "$var" .env 2>/dev/null; then
    echo -e "${GREEN}  ✓ $var configured${NC}"
  else
    echo -e "${YELLOW}  ○ $var not set (optional)${NC}"
  fi
done

echo ""

# ============================================================================
# Summary
# ============================================================================

echo "====================================="
echo -e "${BLUE}📊 Fix Summary${NC}"
echo "====================================="
echo -e "Fixes applied:  ${GREEN}$FIXES_APPLIED${NC}"
echo -e "Warnings:       ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Code quality: BILLION-USER READY${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Review warnings above and fix manually${NC}"
  echo ""
  echo "Common next steps:"
  echo "  1. Add rate limiting to unprotected functions"
  echo "  2. Replace raw console calls with structured logging"
  echo "  3. Refactor files over 200 lines"
  echo "  4. Configure optional Redis env vars for caching"
  exit 1
fi
