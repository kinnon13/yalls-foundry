#!/bin/bash
# Apply ALL billion-user quality fixes
# Run after database migration is approved

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Applying All Billion-User Quality Fixes${NC}"
echo "============================================="
echo ""

# 1. Fix hardcoded tenant IDs
echo -e "${YELLOW}1️⃣  Fixing hardcoded tenant IDs...${NC}"
deno run -A scripts/fix-hardcoded-tenants.ts
echo ""

# 2. Replace console.log with structured logger
echo -e "${YELLOW}2️⃣  Replacing console logs with structured logger...${NC}"
deno run -A scripts/replace-console-logs.ts
echo ""

# 3. Apply rate limiting to all edge functions
echo -e "${YELLOW}3️⃣  Applying rate limiting to edge functions...${NC}"
deno run -A scripts/enforce-rate-limit.ts
echo ""

# 4. Run verification
echo -e "${YELLOW}4️⃣  Running verification checks...${NC}"
./scripts/billion-user-fixes.sh
echo ""

echo -e "${GREEN}✅ All fixes applied successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the changes in git"
echo "  2. Test locally"
echo "  3. Run: psql <db-url> -f scripts/verify-billion-ready.sql"
echo "  4. Commit and deploy"
