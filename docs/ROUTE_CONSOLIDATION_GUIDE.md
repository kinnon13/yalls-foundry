# Route Consolidation - Complete Guide

**Goal:** Reduce App.tsx from 39 routes → ~31 by archiving unused files and moving features to overlays.

**Safety:** Archive-first approach - no hard deletes, fully reversible.

---

## Quick Start

### Option 1: Automated Script (Recommended)

```bash
# Make script executable
chmod +x scripts/route-consolidation.sh

# Run interactively
./scripts/route-consolidation.sh
```

### Option 2: Makefile

```bash
# Run all phases
make all

# Or run phases individually
make phase0  # Create branch & archive
make phase1  # Archive replaced files
make phase2  # Dashboard consolidation
make phase3  # Remove admin routes
make phase4  # Move overlays
make phase5  # Archive orphans
make phase6  # Verify & test
make phase7  # Document & push

# Check status anytime
make status
make routes-count
```

### Option 3: Manual (Step-by-step)

Follow the 7 phases documented below.

---

## Phase-by-Phase Guide

### Phase 0: Setup

```bash
git checkout -b chore/route-consolidation-archive
mkdir -p src/__archive__/$(date +%Y-%m-%d)
```

### Phase 1: Archive Replaced Files

These files have been replaced by `pages/*` implementations:

```bash
ARCHIVE_DIR="src/__archive__/$(date +%Y-%m-%d)"

# Archive old implementations
git mv src/routes/rocker-hub.tsx $ARCHIVE_DIR/rocker-hub.tsx || true
git mv src/routes/super-andy.tsx $ARCHIVE_DIR/super-andy.tsx || true
git mv src/routes/admin-rocker.tsx $ARCHIVE_DIR/admin-rocker.tsx || true
git mv src/pages/Login.tsx $ARCHIVE_DIR/pages-Login.tsx || true
git mv src/pages/SuperAndy.tsx $ARCHIVE_DIR/pages-SuperAndy.tsx || true

git commit -m "chore: archive replaced rocker/andy files (no deletes)"
```

### Phase 2: Dashboard Consolidation

You have multiple dashboard versions. Choose ONE:

1. `src/routes/dashboard.tsx` (original)
2. `src/routes/dashboard-v2.tsx`
3. `src/routes/dashboard-new/index.tsx`

Archive the others:

```bash
# Example: keeping dashboard.tsx
git mv src/routes/dashboard-v2.tsx $ARCHIVE_DIR/dashboard-v2.tsx || true
git mv src/routes/dashboard-new $ARCHIVE_DIR/dashboard-new || true

# Archive duplicate sub-indexes
git mv src/routes/dashboard/approvals/index.tsx $ARCHIVE_DIR/dash-approvals-idx.tsx || true
git mv src/routes/dashboard/earnings/index.tsx $ARCHIVE_DIR/dash-earnings-idx.tsx || true
git mv src/routes/dashboard/orders/index.tsx $ARCHIVE_DIR/dash-orders-idx.tsx || true
git mv src/routes/dashboard/overview/index.tsx $ARCHIVE_DIR/dash-overview-idx.tsx || true

git commit -m "chore: choose single dashboard; archive others"
```

### Phase 3: Remove Admin Routes from App.tsx

**Files stay**, just remove routes from `src/App.tsx`:

Remove these route entries:
- `/admin/a11y`
- `/admin/audit`
- `/admin/claims`
- `/admin/components`
- `/admin/control-room`
- `/admin/features`
- `/admin/routes`
- `/admin/stub-backlog`
- `/admin/system`
- `/admin/tests`
- `/admin/workers`

Keep these:
- `/admin`
- `/admin/guardrails`
- `/admin/approvals`
- `/admin/voice-settings`
- `/admin/super-admin-controls`
- `/admin/role-tool`

```bash
# Edit src/App.tsx manually
git add src/App.tsx
git commit -m "refactor: remove extra admin routes from App.tsx"
```

### Phase 4: Move Overlay Features

Remove these from `src/App.tsx` (accessed via `/?app=...`):
- `/mlm` → `/?app=mlm`
- `/crm` → `/?app=crm`
- `/farm/*` → `/?app=farm-ops`
- `/ai/activity` → `/?app=activity`
- `/incentives/*` → `/?app=incentives`
- `/notifications` → `/?app=notifications`

```bash
git add src/App.tsx
git commit -m "refactor: move overlay features to ?app= system"
```

### Phase 5: Archive Orphans

```bash
git mv src/routes/claim/[entityId].tsx $ARCHIVE_DIR/claim-entityId.tsx || true
git mv src/routes/_diag.tsx $ARCHIVE_DIR/_diag.tsx || true

git commit -m "chore: archive minor orphans"
```

### Phase 6: Verify & Test

```bash
# Count routes
grep -c 'path=' src/App.tsx
# Target: ~31

# Build
pnpm build

# Run tests
pnpm exec playwright test

# Manual checks
pnpm dev
# Visit: /, /dashboard, /rocker, /super-andy, /admin-rocker, /super/*
```

### Phase 7: Document & Push

```bash
# Document results
cat > docs/CONSOLIDATION_COMPLETE.md <<EOF
# Route Consolidation Complete!

Routes: $(grep -c 'path=' src/App.tsx)
Route files: $(find src/routes -name '*.tsx' | wc -l)
Archived: $ARCHIVE_DIR
EOF

git add docs/CONSOLIDATION_COMPLETE.md
git commit -m "docs: consolidation summary"

# Push
git push -u origin chore/route-consolidation-archive
```

---

## Testing

### Run All Tests

```bash
pnpm exec playwright test
```

### Run Pathway Tests Only

```bash
pnpm exec playwright test tests/e2e/pathway-structure.spec.ts
```

### Test Specific Scenarios

```bash
# Heavy mode
pnpm exec playwright test -g "Heavy mode"

# Light mode
pnpm exec playwright test -g "Light mode"

# Auto mode
pnpm exec playwright test -g "Auto mode"
```

---

## Rollback

### Quick Rollback

```bash
# Revert all commits
git revert HEAD~5..HEAD
```

### Restore Specific File

```bash
git mv src/__archive__/YYYY-MM-DD/[file] src/routes/[file]
```

### Restore All Archived Files

```bash
for f in src/__archive__/YYYY-MM-DD/*; do
  basename=$(basename "$f")
  # Restore to original location (adjust paths as needed)
  git mv "$f" "src/routes/$basename"
done
```

---

## CI/CD

### GitHub Actions

The E2E workflow (`.github/workflows/e2e.yml`) runs automatically on:
- PRs to `main`
- Pushes to `chore/route-consolidation-archive`

View results in GitHub Actions tab.

### Local CI Simulation

```bash
# Run what CI runs
pnpm install
npx playwright install --with-deps
pnpm build
pnpm dev &
sleep 5
pnpm exec playwright test
```

---

## Troubleshooting

### Build Fails

```bash
# Check for syntax errors
pnpm tsc --noEmit

# Check for missing imports
grep -r "import.*from.*routes" src/
```

### Tests Fail

```bash
# Run in headed mode to see what's happening
pnpm exec playwright test --headed

# Debug specific test
pnpm exec playwright test --debug tests/e2e/pathway-structure.spec.ts
```

### Routes Not Found

```bash
# Check route count
grep -c 'path=' src/App.tsx

# List all routes
grep 'path=' src/App.tsx | grep -oP 'path="[^"]+"'
```

### Archived File Needed

```bash
# Find file in archive
find src/__archive__ -name "*filename*"

# Restore it
git mv src/__archive__/YYYY-MM-DD/[file] src/routes/[file]
```

---

## Success Criteria

- [ ] `grep -c 'path=' src/App.tsx` shows ~31
- [ ] `pnpm build` succeeds
- [ ] `pnpm exec playwright test` passes
- [ ] All key pages load: `/`, `/dashboard`, `/rocker`, `/super-andy`, `/admin-rocker`, `/super/*`
- [ ] Overlay system works: `/?app=mlm`, `/?app=crm`, `/?app=farm-ops`
- [ ] No console errors on any page
- [ ] CI pipeline green

---

## Next Steps

After successful merge:

1. **Phase 2.0:** Collapse remaining admin panels into dashboard tabs
2. **Phase 3.0:** Enable Heavy Pathway default in `/super/flags`
3. **Cleanup:** Remove archived files after 90 days of stability
4. **Monitor:** Watch for 404s or broken links in production

---

## Support

**Questions or issues?**
- Check `docs/PATHWAY_SMOKE_TESTS.md` for debugging steps
- Review archived files: `ls -la src/__archive__/*/`
- Check CI logs in GitHub Actions
- Contact team for assistance

---

## Files Reference

**Automation:**
- `scripts/route-consolidation.sh` - Interactive script
- `Makefile` - Make targets for each phase
- `.github/workflows/e2e.yml` - CI pipeline

**Tests:**
- `tests/e2e/helpers.ts` - Test utilities
- `tests/e2e/pathway-structure.spec.ts` - Pathway tests
- `playwright.config.ts` - Playwright configuration

**Documentation:**
- `docs/WHERE_EVERYTHING_GOES.md` - Route mapping
- `docs/EXECUTION_CHECKLIST.md` - Step-by-step plan
- `docs/CONSOLIDATION_COMPLETE.md` - Results summary
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template
