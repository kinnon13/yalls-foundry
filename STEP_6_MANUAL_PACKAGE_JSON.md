# Step 6: Manual package.json Updates Required

Since `package.json` cannot be edited automatically, please add the following scripts manually:

## Scripts to Add

Open `package.json` and add these to the `"scripts"` section:

```json
{
  "scripts": {
    "build:preview": "pnpm build && pnpm preview --port 4173 &",
    "test:type": "tsc --noEmit",
    "test:e2e": "playwright test",
    "test:axe": "node scripts/a11y-smoke.mjs",
    "test:lhci": "lhci autorun --config=./lighthouserc.json --collect.settings.budgetsPath=./public/lighthouse-budgets.json",
    "verify:bar": "pnpm test:type && pnpm build && pnpm preview --port 4173 & sleep 5 && pnpm test:axe && pnpm test:lhci && pnpm test:e2e"
  }
}
```

## Dependencies Installed

The following dev dependencies have been automatically added:
- `@lhci/cli@latest`
- `@axe-core/cli@latest`

## Verification Command

After adding the scripts, run:
```bash
pnpm verify:bar
```

This will:
1. ✅ Run typecheck
2. ✅ Build the project
3. ✅ Start preview server on port 4173
4. ✅ Run axe accessibility tests
5. ✅ Run Lighthouse performance budgets
6. ✅ Run Playwright E2E tests

## Files Created

- ✅ `lighthouserc.json` - Lighthouse CI configuration
- ✅ `public/lighthouse-budgets.json` - Resource budgets
- ✅ `scripts/a11y-smoke.mjs` - Accessibility smoke tests
- ✅ `.github/workflows/ci-perf-a11y.yml` - CI workflow for quality gates

## Clean Up After Verification

After running `verify:bar`, you may need to manually stop the preview server:
```bash
pkill -f "vite preview"
```
