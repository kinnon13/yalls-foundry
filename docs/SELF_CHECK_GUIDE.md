# Self-Check Guide

## Before Every PR

Run the complete verification suite:

```bash
pnpm run check:work
```

This script runs:
1. TypeScript compilation check
2. Linting
3. Build verification
4. E2E test suite
5. Route count validation
6. File structure checks

## Manual Checks

### 1. Route Count
```bash
grep -c 'path=' src/App.tsx
```
**Expected**: 28-34 routes (target ~31)

### 2. Overlay System
- Visit `/?app=messages` - should load
- Visit `/?app=yallbrary` - should load
- Visit `/?app=invalid` - should show nothing (no crash)

### 3. Key Pages Load
- `/` - Home
- `/rocker` - User Rocker Hub
- `/dashboard` - Dashboard
- `/super` - Super Console (super admin only)
- `/super-andy` - Super Andy (super admin only)
- `/admin-rocker` - Admin Rocker (admin only)

### 4. Accessibility
```bash
pnpm exec playwright test tests/e2e/a11y-smoke.spec.ts
```

### 5. Performance
- Overlay load < 300ms
- Route TTI < 2.5s (p95)
- No console errors

## Definition of Done Checklist

For overlay/routing changes:
- [ ] Overlay registry updated
- [ ] Routes redirect correctly
- [ ] Navigation labels updated
- [ ] Tests added/updated
- [ ] CI passes
- [ ] Route count within range
- [ ] No accessibility violations
- [ ] Documentation updated

For AI/backend changes:
- [ ] RLS policies reviewed
- [ ] Edge function deployed
- [ ] Secrets configured (if needed)
- [ ] Budget/circuit breaker impacts considered
- [ ] Telemetry events added
- [ ] Tests cover new paths

## Quick Fixes

### Route count too high
```bash
# Find routes
grep -n 'path=' src/App.tsx

# Archive unused routes
scripts/archive.sh --dry-run src/routes/old-feature.tsx
```

### Test failures
```bash
# Run specific test
pnpm exec playwright test tests/e2e/pathway-structure.spec.ts

# Debug mode
pnpm exec playwright test --debug

# Update snapshots (if using)
pnpm exec playwright test --update-snapshots
```

### Build errors
```bash
# Clear caches
rm -rf dist node_modules/.vite
pnpm install
pnpm build
```

## CI Status

Check workflow status:
- E2E Tests: `.github/workflows/e2e.yml`
- Perf & A11y: `.github/workflows/ci-perf-a11y.yml`

Both must pass before merge.

## Rollback Plan

If issues found after merge:
```bash
# Revert last commit
git revert HEAD

# Or specific commit
git revert <commit-sha>

# Restore archived files
git mv archive/TIMESTAMP/path/to/file.tsx src/routes/file.tsx
```

All archived files remain in `archive/` for easy restoration.
