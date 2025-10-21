#!/bin/bash
# Setup all branches for parallel development
# Run this once to create the 7-branch structure

set -euo pipefail

REMOTE=${REMOTE:-origin}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌳 Setting up 7-branch parallel development structure${NC}"
echo "======================================================================"
echo ""
echo "This will create:"
echo "  - staging (integration branch)"
echo "  - 5 feature branches off main"
echo ""
echo "Remote: $REMOTE"
echo ""

# Confirm
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Aborted.${NC}"
  exit 1
fi

# Make sure local main is up-to-date
echo ""
echo -e "${BLUE}1️⃣  Updating main...${NC}"
git fetch $REMOTE
git checkout main
git pull --ff-only $REMOTE main
echo -e "${GREEN}✅ Main updated${NC}"

# Create staging
echo ""
echo -e "${BLUE}2️⃣  Creating staging branch...${NC}"
if git show-ref --verify --quiet refs/heads/staging; then
  echo -e "${YELLOW}⚠️  staging already exists locally${NC}"
else
  git checkout -b staging main
  git push -u $REMOTE staging
  echo -e "${GREEN}✅ Staging created${NC}"
fi

# Create feature branches
echo ""
echo -e "${BLUE}3️⃣  Creating feature branches...${NC}"

BRANCHES=(
  "feature/ui-polish"
  "feature/tenant-security"
  "feature/search-isolation"
  "feature/job-queue"
  "feature/observability"
)

for branch in "${BRANCHES[@]}"; do
  if git show-ref --verify --quiet refs/heads/$branch; then
    echo -e "${YELLOW}⚠️  $branch already exists${NC}"
  else
    git checkout main
    git checkout -b $branch
    git push -u $REMOTE $branch
    echo -e "${GREEN}✅ Created $branch${NC}"
  fi
done

# Summary
echo ""
echo -e "${GREEN}✅ All branches created!${NC}"
echo ""
echo "Branch structure:"
echo "  main                      (production)"
echo "  ├── staging               (integration)"
echo "  └── feature/*"
echo "      ├── ui-polish"
echo "      ├── tenant-security"
echo "      ├── search-isolation"
echo "      ├── job-queue"
echo "      └── observability"
echo ""
echo "Next steps:"
echo "  1. Protect main & staging on GitHub (Settings → Branches)"
echo "  2. Add .github/CODEOWNERS to main"
echo "  3. Enable CI workflow"
echo "  4. Assign owners to each feature branch"
echo ""
echo "To work on a feature:"
echo "  git checkout feature/ui-polish"
echo "  git rebase origin/staging  # (or merge)"
echo "  # make changes..."
echo "  git push"
echo "  # Open PR with base=staging"
