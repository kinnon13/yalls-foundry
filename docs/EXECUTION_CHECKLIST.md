# ✅ EXECUTION CHECKLIST - Step by Step

## 🎯 Goal
Reduce App.tsx from 39 routes to 31 routes by moving features to overlay system.

---

## Phase 1: SAFE DELETIONS (5 min) ✅

Delete replaced files with 100% confidence:

```bash
# Step 1.1: Delete old rocker/andy files
rm src/routes/rocker-hub.tsx
rm src/routes/super-andy.tsx
rm src/routes/admin-rocker.tsx

# Step 1.2: Delete duplicate pages
rm src/pages/Login.tsx
rm src/pages/SuperAndy.tsx

# Step 1.3: Commit
git add -A
git commit -m "chore: remove replaced rocker/andy files"
```

**Expected Result:** 5 files deleted, build still works

---

## Phase 2: DASHBOARD CONSOLIDATION (15 min) ⚠️

### Step 2.1: Determine Active Dashboard

Check which dashboard is imported in App.tsx:

```bash
grep "dashboard" src/App.tsx | grep "lazy"
```

**Current imports (line 63):**
```tsx
const AdminDashboard = lazy(() => import('./routes/admin'));
```

Look for actual dashboard route at `/dashboard`:

```bash
grep "path=\"/dashboard\"" src/App.tsx -A 3
```

**Current (line 171):**
```tsx
<Route path="/dashboard" element={<Navigate to="/?mode=manage" replace />} />
```

**Finding:** `/dashboard` currently redirects to Home! No dashboard version is active.

### Step 2.2: Choose Dashboard Version

Three options exist:
```
A. routes/dashboard.tsx          (original)
B. routes/dashboard-v2.tsx        (version 2)
C. routes/dashboard-new/index.tsx (new)
```

**Action Required:** Pick ONE and update App.tsx line 171.

### Step 2.3: Delete Unused Versions

After choosing, delete others:

```bash
# If keeping dashboard.tsx:
rm src/routes/dashboard-v2.tsx
rm -rf src/routes/dashboard-new/

# If keeping dashboard-v2.tsx:
rm src/routes/dashboard.tsx
rm -rf src/routes/dashboard-new/

# If keeping dashboard-new/:
rm src/routes/dashboard.tsx
rm src/routes/dashboard-v2.tsx
```

### Step 2.4: Delete Duplicate Index Files

```bash
rm src/routes/dashboard/approvals/index.tsx    # duplicate of approvals.tsx
rm src/routes/dashboard/earnings/index.tsx     # duplicate of earnings.tsx
rm src/routes/dashboard/orders/index.tsx       # duplicate of orders.tsx
rm src/routes/dashboard/overview/index.tsx     # duplicate of overview.tsx
```

### Step 2.5: Commit

```bash
git add -A
git commit -m "chore: consolidate dashboard to single version"
```

**Expected Result:** 2-3 files deleted, dashboard works

---

## Phase 3: REMOVE ADMIN ROUTES FROM APP.TSX (30 min) 🔧

### Step 3.1: Identify Admin Routes to Remove

These admin routes in App.tsx should be removed (move to dashboard tabs or overlays):

```tsx
// REMOVE THESE from App.tsx (not in our 31-route target):
/admin/a11y
/admin/audit
/admin/claims
/admin/components
/admin/control-room
/admin/features
/admin/routes
/admin/stub-backlog
/admin/system
/admin/tests
/admin/workers
```

### Step 3.2: Update App.tsx

Open `src/App.tsx` and remove lazy imports for:

```tsx
// DELETE these lazy imports (NOT in our list):
// const A11yAdminPage = lazy(() => import('./routes/admin/a11y'));
// const AuditPage = lazy(() => import('./routes/admin/audit'));
// ... etc for all admin routes above
```

Remove route definitions for these paths.

### Step 3.3: Verify Files Still Exist

These files should stay (accessed via `/dashboard?tab=admin&view=x`):

```bash
ls src/routes/admin/*.tsx
# Keep all files, just remove from App.tsx routing
```

### Step 3.4: Commit

```bash
git add src/App.tsx
git commit -m "refactor: remove admin routes from App.tsx, access via dashboard"
```

**Expected Result:** App.tsx routes reduced, files remain for dashboard tabs

---

## Phase 4: REMOVE OVERLAY ROUTES FROM APP.TSX (30 min) 🔄

### Step 4.1: Check Overlay System is Wired

Verify overlay system is active:

```bash
grep "OverlayProvider" src/App.tsx
```

Should see: `<OverlayProvider>` wrapping app content.

### Step 4.2: Remove Overlay Routes

These routes should be removed from App.tsx (accessed via `/?app=key`):

```tsx
// REMOVE from App.tsx:
/mlm                  → /?app=mlm
/crm                  → /?app=crm
/farm/*               → /?app=farm-ops
/ai/activity          → /?app=activity
/incentives/*         → /?app=incentives
/notifications        → /?app=notifications
```

### Step 4.3: Update App.tsx

Remove lazy imports and routes for overlay-only features:

```tsx
// DELETE these if they exist:
const MLMPage = lazy(() => import('./routes/mlm/index'));
const CRMPage = lazy(() => import('./routes/crm/index'));
// ... etc
```

### Step 4.4: Test Overlays Work

Start dev server:
```bash
pnpm dev
```

Test overlay opens:
```
http://localhost:5173/?app=mlm
http://localhost:5173/?app=crm
http://localhost:5173/?app=farm-ops
```

### Step 4.5: Commit

```bash
git add src/App.tsx
git commit -m "refactor: move overlays to /?app= system"
```

**Expected Result:** Routes removed from App.tsx, overlays work via ?app=

---

## Phase 5: DELETE ORPHANED FILES (45 min) 🗑️

### Step 5.1: Delete Farm Ops Direct Routes

Farm ops should only be accessed via overlay:

```bash
# Remove farm ops routes (if they exist in App.tsx)
# Files stay for overlay system to load
```

### Step 5.2: Delete Claim Route

Redirect already handles this:

```bash
rm src/routes/claim/[entityId].tsx
```

### Step 5.3: Delete Diagnostic Route (Optional)

```bash
rm src/routes/_diag.tsx  # or keep for debugging
```

### Step 5.4: Search for More Orphans

```bash
# Find files not imported anywhere
grep -r "import.*routes/compose" src/ || echo "compose.tsx is orphaned"
grep -r "import.*routes/insights" src/ || echo "insights are orphaned"
```

### Step 5.5: Commit

```bash
git add -A
git commit -m "chore: remove orphaned route files"
```

**Expected Result:** Orphaned files deleted, build still works

---

## Phase 6: VERIFY & TEST (30 min) ✅

### Step 6.1: Count Routes in App.tsx

```bash
grep -c "path=" src/App.tsx
```

**Target:** Should be around 31 routes

### Step 6.2: Run Build

```bash
pnpm build
```

**Expected:** No errors

### Step 6.3: Test Core Routes

```bash
pnpm dev
```

Visit each of the 31 routes:
- [ ] /
- [ ] /discover
- [ ] /dashboard
- [ ] /messages
- [ ] /profile/test-id
- [ ] /entities
- [ ] /events
- [ ] /listings
- [ ] /cart
- [ ] /orders
- [ ] /rocker
- [ ] /rocker/preferences
- [ ] /super-andy
- [ ] /admin-rocker
- [ ] /admin
- [ ] /super (if super admin)

### Step 6.4: Test Overlays

Visit overlay URLs:
- [ ] /?app=messages
- [ ] /?app=marketplace
- [ ] /?app=crm
- [ ] /?app=farm-ops
- [ ] /?app=mlm

### Step 6.5: Test Redirects

Visit legacy URLs (should redirect):
- [ ] /home → /
- [ ] /marketplace → /listings
- [ ] /farm/calendar → /dashboard?tab=farm&view=calendar

### Step 6.6: Run Playwright Tests

```bash
pnpm exec playwright test tests/e2e/super.e2e.spec.ts
```

### Step 6.7: Final Commit

```bash
git add -A
git commit -m "refactor: complete route consolidation to 31 routes"
```

---

## Phase 7: DOCUMENT FINAL STATE (15 min) 📝

### Step 7.1: Count Final Stats

```bash
# Count routes
grep -c "path=" src/App.tsx

# Count route files
find src/routes -name "*.tsx" | wc -l

# Count page files
find src/pages -name "*.tsx" | wc -l
```

### Step 7.2: Update Audit Doc

Update `docs/COMPLETE_SITE_AUDIT.md` with new stats.

### Step 7.3: Create Summary

```bash
echo "Route Consolidation Complete!" > docs/CONSOLIDATION_COMPLETE.md
echo "Routes: 39 → $(grep -c 'path=' src/App.tsx)" >> docs/CONSOLIDATION_COMPLETE.md
echo "Files: 145 → $(find src/routes -name '*.tsx' | wc -l)" >> docs/CONSOLIDATION_COMPLETE.md
```

---

## 📊 PROGRESS TRACKER

| Phase | Status | Time | Result |
|-------|--------|------|--------|
| 1. Safe Deletions | ⬜ | 5 min | 5 files deleted |
| 2. Dashboard Consolidation | ⬜ | 15 min | 2-3 files deleted |
| 3. Remove Admin Routes | ⬜ | 30 min | ~10 routes removed |
| 4. Remove Overlay Routes | ⬜ | 30 min | ~8 routes removed |
| 5. Delete Orphans | ⬜ | 45 min | ~10 files deleted |
| 6. Verify & Test | ⬜ | 30 min | All tests pass |
| 7. Document | ⬜ | 15 min | Docs updated |
| **TOTAL** | | **2.5 hrs** | **31 routes, ~60 files** |

---

## 🚨 ROLLBACK PLAN

If anything breaks:

```bash
# Revert last commit
git reset --hard HEAD~1

# Or revert specific phase
git log --oneline  # find commit hash
git revert <hash>
```

---

## ✅ DEFINITION OF DONE

- [ ] App.tsx has 31 routes (not 39)
- [ ] All 5 replaced files deleted
- [ ] Dashboard consolidated to 1 version
- [ ] Admin routes removed from App.tsx
- [ ] Overlay routes removed from App.tsx
- [ ] Orphaned files deleted
- [ ] Build succeeds (`pnpm build`)
- [ ] All core routes load
- [ ] All overlays work via `?app=`
- [ ] Redirects work for legacy URLs
- [ ] Playwright tests pass
- [ ] Documentation updated

---

**Start with Phase 1 and work through each phase sequentially. Test after each phase.**
