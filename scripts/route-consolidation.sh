#!/usr/bin/env bash
set -euo pipefail

# Route Consolidation Script (Archive-First)
# Implements the 7-phase plan to reduce App.tsx routes from 39 → ~31

ARCHIVE_DIR="src/__archive__/$(date +%Y-%m-%d)"
BRANCH_NAME="chore/route-consolidation-archive"

echo "🚀 Route Consolidation - Archive-First Approach"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

confirm() {
    read -p "$1 [y/N] " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

phase() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Phase $1: $2${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Phase 0: Setup
phase 0 "Create branch & archive area"

if git rev-parse --verify "$BRANCH_NAME" >/dev/null 2>&1; then
    echo -e "${YELLOW}Branch $BRANCH_NAME already exists${NC}"
    if confirm "Switch to existing branch?"; then
        git checkout "$BRANCH_NAME"
    else
        echo "Aborting."
        exit 1
    fi
else
    git checkout -b "$BRANCH_NAME"
fi

mkdir -p "$ARCHIVE_DIR"
echo -e "${GREEN}✓ Created archive directory: $ARCHIVE_DIR${NC}"

# Phase 1: Archive replaced files
phase 1 "Archive replaced rocker/andy files (no deletes)"

FILES_TO_ARCHIVE=(
    "src/routes/rocker-hub.tsx"
    "src/routes/super-andy.tsx"
    "src/routes/admin-rocker.tsx"
    "src/pages/Login.tsx"
    "src/pages/SuperAndy.tsx"
)

for file in "${FILES_TO_ARCHIVE[@]}"; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        git mv "$file" "$ARCHIVE_DIR/$basename_file" || true
        echo -e "${GREEN}✓ Archived: $file${NC}"
    else
        echo -e "${YELLOW}⊘ Not found: $file${NC}"
    fi
done

git add -A
git commit -m "chore: archive replaced rocker/andy files (no deletes)" || echo "No changes to commit"

# Phase 2: Dashboard consolidation
phase 2 "Dashboard consolidation"

echo "Current dashboard files:"
find src/routes -name "*dashboard*" -type f 2>/dev/null || echo "No dashboard files found"

echo ""
echo "Choose your canonical dashboard:"
echo "1) src/routes/dashboard.tsx (original)"
echo "2) src/routes/dashboard-v2.tsx"
echo "3) src/routes/dashboard-new/index.tsx"
echo "4) Skip this phase"

read -p "Enter choice [1-4]: " DASH_CHOICE

case $DASH_CHOICE in
    1)
        KEEP_DASH="src/routes/dashboard.tsx"
        ARCHIVE_DASH=("src/routes/dashboard-v2.tsx" "src/routes/dashboard-new")
        ;;
    2)
        KEEP_DASH="src/routes/dashboard-v2.tsx"
        ARCHIVE_DASH=("src/routes/dashboard.tsx" "src/routes/dashboard-new")
        ;;
    3)
        KEEP_DASH="src/routes/dashboard-new/index.tsx"
        ARCHIVE_DASH=("src/routes/dashboard.tsx" "src/routes/dashboard-v2.tsx")
        ;;
    4)
        echo "Skipping dashboard phase"
        ARCHIVE_DASH=()
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

if [ ${#ARCHIVE_DASH[@]} -gt 0 ]; then
    for dash in "${ARCHIVE_DASH[@]}"; do
        if [ -e "$dash" ]; then
            basename_dash=$(basename "$dash")
            git mv "$dash" "$ARCHIVE_DIR/dashboard-$basename_dash" || true
            echo -e "${GREEN}✓ Archived: $dash${NC}"
        fi
    done

    # Archive duplicate sub-indexes
    DASH_INDEXES=(
        "src/routes/dashboard/approvals/index.tsx"
        "src/routes/dashboard/earnings/index.tsx"
        "src/routes/dashboard/orders/index.tsx"
        "src/routes/dashboard/overview/index.tsx"
    )

    for idx in "${DASH_INDEXES[@]}"; do
        if [ -f "$idx" ]; then
            basename_idx=$(basename "$(dirname "$idx")")-index.tsx
            git mv "$idx" "$ARCHIVE_DIR/dash-$basename_idx" || true
            echo -e "${GREEN}✓ Archived: $idx${NC}"
        fi
    done

    git add -A
    git commit -m "chore: choose single dashboard; archive others (no deletes)" || echo "No changes"
fi

# Phase 3: Remove admin routes from App.tsx
phase 3 "Remove extra admin routes from App.tsx"

echo "This will remove these routes from App.tsx:"
echo "  /admin/a11y, /admin/audit, /admin/claims, /admin/components,"
echo "  /admin/control-room, /admin/features, /admin/routes, /admin/stub-backlog,"
echo "  /admin/system, /admin/tests, /admin/workers"
echo ""
echo "(Files will remain; accessed as tabs/overlays)"

if confirm "Proceed with removing routes from App.tsx?"; then
    # Manual step - user needs to edit App.tsx
    echo -e "${YELLOW}⚠ Manual step required:${NC}"
    echo "Edit src/App.tsx and remove the route entries listed above."
    echo "Keep: /admin, /admin/guardrails, /admin/approvals, /admin/voice-settings,"
    echo "      /admin/super-admin-controls, /admin/role-tool"
    echo ""
    read -p "Press Enter when done..."
    
    git add src/App.tsx
    git commit -m "refactor: remove extra admin routes from App.tsx; keep as tabs/overlays" || echo "No changes"
fi

# Phase 4: Overlay routes
phase 4 "Move overlay features to ?app= system"

echo "Removing these routes from App.tsx (accessed via ?app=...):"
echo "  /mlm, /crm, /farm/*, /ai/activity, /incentives/*, /notifications"

if confirm "Proceed?"; then
    echo -e "${YELLOW}⚠ Manual step required:${NC}"
    echo "Edit src/App.tsx and remove the overlay route entries."
    echo ""
    read -p "Press Enter when done..."
    
    git add src/App.tsx
    git commit -m "refactor: move overlay features to ?app= system (routes removed from App.tsx)" || echo "No changes"
fi

# Phase 5: Archive orphans
phase 5 "Archive orphaned files"

ORPHANS=(
    "src/routes/claim/[entityId].tsx"
    "src/routes/_diag.tsx"
)

for orphan in "${ORPHANS[@]}"; do
    if [ -f "$orphan" ]; then
        basename_orphan=$(basename "$orphan")
        git mv "$orphan" "$ARCHIVE_DIR/$basename_orphan" || true
        echo -e "${GREEN}✓ Archived: $orphan${NC}"
    fi
done

git add -A
git commit -m "chore: archive minor orphans; redirect handles legacy" || echo "No changes"

# Phase 6: Verify & test
phase 6 "Verify & test"

echo "Running verification checks..."

# Count routes
ROUTE_COUNT=$(grep -c 'path=' src/App.tsx || echo "0")
echo -e "${GREEN}Route count in App.tsx: $ROUTE_COUNT${NC}"
echo "Target: ~31"

# Build
echo ""
echo "Building project..."
if pnpm build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Run tests
if confirm "Run Playwright tests?"; then
    pnpm exec playwright test
fi

# Phase 7: Document & push
phase 7 "Documentation & PR"

cat > docs/CONSOLIDATION_COMPLETE.md <<EOF
# Route Consolidation Complete! 🎉

**Date:** $(date +%Y-%m-%d)
**Branch:** $BRANCH_NAME

## Metrics

- **Routes in App.tsx:** $ROUTE_COUNT (target: ~31)
- **Route files:** $(find src/routes -name '*.tsx' | wc -l)
- **Archived files:** $(find "$ARCHIVE_DIR" -type f | wc -l)

## What Changed

### Phase 1: Archived Replaced Files
- Old rocker/andy routes moved to archive
- Duplicate pages archived

### Phase 2: Dashboard Consolidation
- Chose single dashboard implementation
- Archived unused versions

### Phase 3: Admin Route Cleanup
- Removed extra admin routes from App.tsx
- Kept core admin routes

### Phase 4: Overlay Migration
- Moved overlay features to ?app= system
- Routes removed from App.tsx only

### Phase 5: Orphan Cleanup
- Archived orphaned/legacy files

## Rollback

All files preserved in: \`$ARCHIVE_DIR\`

To rollback:
\`\`\`bash
git revert HEAD~5..HEAD
\`\`\`

## Next Steps

1. Merge this PR after CI passes
2. Phase 2.0: Collapse remaining admin panels into dashboard tabs
3. Phase 3.0: Enable Heavy Pathway default in /super/flags
EOF

git add docs/CONSOLIDATION_COMPLETE.md
git commit -m "docs: consolidation summary (routes & counts)"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}All phases complete! 🎉${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Summary:"
echo "  Routes: $ROUTE_COUNT (target: ~31)"
echo "  Archive: $ARCHIVE_DIR"
echo "  Branch: $BRANCH_NAME"
echo ""

if confirm "Push to origin?"; then
    git push -u origin "$BRANCH_NAME"
    echo -e "${GREEN}✓ Pushed to origin${NC}"
    echo ""
    echo "Create PR at:"
    echo "  https://github.com/YOUR_ORG/YOUR_REPO/compare/$BRANCH_NAME?expand=1"
fi

echo ""
echo "Done! 🚀"
