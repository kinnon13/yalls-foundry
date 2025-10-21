#!/bin/bash
# Create release branch from staging

set -euo pipefail

REMOTE=${REMOTE:-origin}
DATE=$(date +%Y-%m-%d)
RELEASE_BRANCH="release/$DATE"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Creating release branch: $RELEASE_BRANCH${NC}"
echo "=========================================================="
echo ""

# Fetch latest
git fetch $REMOTE

# Check staging is clean
echo -e "${BLUE}Checking staging status...${NC}"
UNCOMMITTED=$(git log --oneline $REMOTE/staging --since="24 hours ago" | wc -l)
echo "Commits to staging in last 24h: $UNCOMMITTED"
echo ""

if [ "$UNCOMMITTED" -gt 5 ]; then
  echo -e "${YELLOW}⚠️  Warning: Staging has had $UNCOMMITTED commits in the last 24 hours${NC}"
  echo "Release branches should be cut from stable staging (24-48h bake)"
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. Let staging bake longer."
    exit 1
  fi
fi

# Check if release already exists
if git show-ref --verify --quiet refs/heads/$RELEASE_BRANCH; then
  echo -e "${RED}❌ $RELEASE_BRANCH already exists!${NC}"
  exit 1
fi

# Pre-release checklist
echo -e "${BLUE}Pre-release checklist:${NC}"
echo "  [ ] Staging stable for 24-48h?"
echo "  [ ] All tests green on staging?"
echo "  [ ] Security audit passed?"
echo "  [ ] Feature flags configured?"
echo "  [ ] Runbooks up-to-date?"
echo "  [ ] On-call rotation staffed?"
echo ""
read -p "All checks passed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Aborted. Complete checklist first.${NC}"
  exit 1
fi

# Create release
echo ""
echo -e "${BLUE}Creating release from staging...${NC}"
git checkout -b $RELEASE_BRANCH $REMOTE/staging
git push -u $REMOTE $RELEASE_BRANCH

echo ""
echo -e "${GREEN}✅ Release branch created: $RELEASE_BRANCH${NC}"
echo ""
echo "Next steps:"
echo "  1. Open PR: $RELEASE_BRANCH → main"
echo "  2. Canary deploy:"
echo "     - 10% traffic → monitor 2h"
echo "     - 50% traffic → monitor 4h"
echo "     - 100% rollout"
echo "  3. If green → merge PR"
echo "  4. Tag release:"
echo "     git tag -a v1.2.3 -m 'Release $DATE'"
echo "     git push $REMOTE --tags"
echo ""
echo "If issues found:"
echo "  - Fix on release branch directly"
echo "  - OR rollback to previous tag"
echo "  - OR cut rollback release from previous tag"
