#!/bin/bash
# Cherry-pick staging commits to main (if not using release branches)
# WARNING: Release branches are preferred. Use this only if needed.

set -euo pipefail

REMOTE=${REMOTE:-origin}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🍒 Cherry-pick staging → main${NC}"
echo "======================================"
echo ""

# Fetch latest
echo -e "${BLUE}Fetching latest...${NC}"
git fetch $REMOTE

# Switch to main and update
echo -e "${BLUE}Updating main...${NC}"
git checkout main
git pull --ff-only $REMOTE main

# Get list of commits to cherry-pick
echo ""
echo -e "${BLUE}Commits on staging not in main:${NC}"
COMMITS=$(git log --reverse --pretty=format:%H $REMOTE/main..$REMOTE/staging)

if [ -z "$COMMITS" ]; then
  echo -e "${GREEN}✅ No commits to cherry-pick. main is up-to-date.${NC}"
  exit 0
fi

# Show commits
git log --oneline $REMOTE/main..$REMOTE/staging
echo ""

# Confirm
read -p "Cherry-pick these commits? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Aborted.${NC}"
  exit 1
fi

# Cherry-pick each commit
echo ""
for c in $COMMITS; do
  echo -e "${BLUE}Cherry-picking $c${NC}"
  git show --stat $c
  echo ""
  
  git cherry-pick -x $c || {
    echo -e "${RED}❌ Conflict detected!${NC}"
    echo ""
    echo "Resolve conflicts manually, then run:"
    echo "  git cherry-pick --continue"
    echo ""
    echo "Or skip this commit:"
    echo "  git cherry-pick --skip"
    echo ""
    echo "Or abort:"
    echo "  git cherry-pick --abort"
    exit 1
  }
done

echo ""
echo -e "${GREEN}✅ All commits cherry-picked successfully!${NC}"
echo ""
echo "Review changes:"
echo "  git log --oneline -n 10"
echo ""
echo "Push to main:"
echo "  git push $REMOTE main"
echo ""
echo -e "${YELLOW}⚠️  Reminder: Release branches are preferred over cherry-picking${NC}"
