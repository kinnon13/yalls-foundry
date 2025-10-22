## What changed (one-liner)
<!-- e.g., "Step 1: overlay scoped to /dashboard, Overview role=user. No route changes." -->

## Files touched
- [ ] DID NOT modify `src/App.tsx` routes count (>10 is blocked)
- [ ] DID NOT add `<OverlayHost/>` or `<PanelHost/>` in `src/App.tsx`

## Proof (paste outputs)

### 1) Route budget
```bash
node scripts/check-routes.mjs
```
**Expected:** Route count: 10

### 2) CI Guards
```bash
node scripts/ci-guards.mjs
```
**Expected:** ✅ CI guards passed

### 3) E2E (paste last 10 lines)
```bash
pnpm exec playwright test tests/e2e/overlay-scope.spec.ts tests/e2e/dynamic-home.spec.ts
```

### 4) Manual checks (1 sentence each)
- [ ] `/` → no overlay (even with `?app=yallbrary`)
- [ ] `/dashboard?app=yallbrary` → overlay opens
- [ ] `/dashboard?app=overview` → no 403

## Request to proceed
- [ ] I certify gates passed. Requesting approval for next step.

---

## Scope

- [ ] Areas updated (config-driven): `configs/area-discovery.json`
- [ ] Rocker control plane RPCs
- [ ] KPI spine & tiles
- [ ] EquineStats (public + private)
- [ ] Growth (Network & Affiliates)
- [ ] Theme overrides (user/workspace)
- [ ] Route redirects

## Security & RLS

- New tables RLS: (summary)
- Security definer functions audited: (list)

## Acceptance Checks

- [ ] Changing `configs/area-discovery.json` re-groups UI without redeploy
- [ ] Legacy routes redirect correctly preserving state
- [ ] `set_theme_overrides` updates UI at runtime
- [ ] KPI tiles reflect new data within ~2 minutes
- [ ] RLS policies prevent cross-workspace access
- [ ] Evidence pack is complete

## Rollback Plan

<!-- How to rollback if needed -->
