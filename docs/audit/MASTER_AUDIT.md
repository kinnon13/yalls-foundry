# Master Audit - Project State

**Last Updated:** Manual - Run `npm run audit` to regenerate

---

## Purpose

This document tracks the **actual** vs **intended** state of the project architecture.

## Quick Commands

```bash
# Generate complete tree snapshot
npm run audit:tree

# Generate app/route/page inventory
npm run audit:inventory

# Run both
npm run audit
```

---

## Expected Architecture (Golden Standard)

### 1. Route Budget: EXACTLY 10 Routes in App.tsx

**Main `<Routes>` block should contain:**

1. `/` - Landing page
2. `/auth` - Auth page
3. `/auth/callback` - OAuth callback
4. `/dashboard` - Dashboard (overlay host)
5. `/privacy` - Privacy policy
6. `/terms` - Terms of service
7. `/healthz` - Health check
8. `/super-andy` - Super Andy standalone
9. `/settings` - Settings standalone (if needed)
10. `/*` - LegacyRedirector (catch-all)

**Enforced by:** `scripts/check-routes.mjs` in CI

---

### 2. Overlay Apps in `src/apps/`

All mini-apps live under `src/apps/{app-id}/` with this structure:

```
src/apps/{app-id}/
  ├── contract.ts      # Required: id, title, routes[], role
  ├── Entry.tsx        # Required: Full-screen entry point
  ├── Panel.tsx        # Optional: Side-panel view
  └── README.md        # Optional: App-specific docs
```

**Current Apps:**
- `overview` - Dashboard home
- `notifications` - Notification center
- `analytics` - Analytics dashboard
- `settings` - User settings
- *(more will be added)*

**Accessed via:** `/?app={app-id}` or routes in contract

---

### 3. Pages in `src/pages/`

Standalone pages that are **NOT** overlay apps:

- `SuperAndy/` - Super Andy chat interface
- `UserRocker/` - User Rocker hub
- `AdminRocker/` - Admin workspace
- `Super/` - Super console
- `Auth/` - Authentication pages
- `Landing.tsx` - Marketing landing
- `Privacy.tsx` - Privacy policy
- `Terms.tsx` - Terms of service
- `Healthz.tsx` - Health endpoint

---

### 4. Documentation Structure

```
docs/
  ├── README.md                    # Main index
  ├── SITE_STRUCTURE.md            # Three surfaces overview
  ├── QUICK_REFERENCE_MAP.md       # Route decision tree
  ├── architecture/                # System design docs
  ├── processes/                   # Workflows & branching
  ├── runbooks/                    # Operational guides
  ├── testing/                     # Test guides
  └── audit/                       # THIS SECTION
      ├── MASTER_AUDIT.md          # This file
      ├── TREE_SNAPSHOT.md         # Auto-generated tree
      └── INVENTORY.md             # Auto-generated inventory
```

---

### 5. Critical Constraints (CI Guards)

**Enforced in CI by `scripts/ci-guards.mjs`:**

1. ✅ `OverlayHost` MUST NOT be in `App.tsx` (only in `/dashboard`)
2. ✅ `PanelHost` MUST NOT be global (only in `/dashboard`)
3. ✅ `LegacyRedirector` MUST exist as catch-all route
4. ✅ `overview` app MUST have role `'user'`
5. ✅ `OVERLAY_REGISTRY` must be defined in `src/lib/overlay/registry.ts`

---

## Known Issues & Discrepancies

### Issues Found:
*(Run audit scripts to populate)*

1. **Route count mismatch** - CI reports 30 routes instead of 10
   - **Status:** Investigating
   - **Script:** `scripts/check-routes.mjs` needs debugging
   - **Action:** Added debug logs to identify which `<Routes>` block is being counted

2. **Missing apps in inventory**
   - **Status:** TBD
   - **Action:** Run `npm run audit:inventory` to verify

---

## Validation Steps

To verify project state:

1. **Run full audit:**
   ```bash
   npm run audit
   ```

2. **Check CI guards:**
   ```bash
   npm run guard
   ```

3. **Verify route budget:**
   ```bash
   npm run check:routes
   ```

4. **Review generated reports:**
   - `docs/audit/TREE_SNAPSHOT.md`
   - `docs/audit/INVENTORY.md`

---

## Recovery Protocol

If audit reveals major discrepancies:

1. **Compare against golden standard** (this doc)
2. **Review git history** to find where divergence occurred
3. **Restore from known-good commit** if needed
4. **Update this doc** with findings
5. **Fix CI guards** to prevent future regressions

---

## Maintenance

- **Update this doc** whenever architecture changes
- **Regenerate snapshots** after major refactors
- **Run audits** before deploying to production
- **Keep CI guards** in sync with architecture rules
