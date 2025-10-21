#!/bin/bash
# Create daily migration train branch

set -euo pipefail

REMOTE=${REMOTE:-origin}
DATE=$(date +%Y%m%d)
TRAIN_BRANCH="train/db-$DATE"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚂 Creating migration train: $TRAIN_BRANCH${NC}"
echo "======================================================"
echo ""

# Fetch latest
git fetch $REMOTE

# Check if train already exists
if git show-ref --verify --quiet refs/heads/$TRAIN_BRANCH; then
  echo -e "${YELLOW}⚠️  $TRAIN_BRANCH already exists locally${NC}"
  echo ""
  read -p "Use existing branch? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
  git checkout $TRAIN_BRANCH
else
  # Create from staging
  git checkout -b $TRAIN_BRANCH $REMOTE/staging
  git push -u $REMOTE $TRAIN_BRANCH
  echo -e "${GREEN}✅ Created $TRAIN_BRANCH${NC}"
fi

echo ""
echo "Migration train is ready!"
echo ""
echo "All DB change PRs should target: $TRAIN_BRANCH"
echo ""
echo "After all DB changes merge to train:"
echo "  1. CI runs train smoke test"
echo "  2. If green → merge train to staging"
echo "  3. Delete train branch"
echo ""
echo "To merge train → staging:"
echo "  git checkout staging"
echo "  git merge --no-ff $TRAIN_BRANCH"
echo "  git push $REMOTE staging"
echo "  git push $REMOTE :$TRAIN_BRANCH  # delete remote"
echo "  git branch -d $TRAIN_BRANCH       # delete local"
