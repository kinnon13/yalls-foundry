# 🧹 CLEANUP CHECKLIST - Delete These Files

## ✅ Safe to Delete NOW (100% Confidence)

### Replaced by New Implementation
```bash
# Old rocker/andy files (replaced by pages/*)
rm src/routes/rocker-hub.tsx
rm src/routes/super-andy.tsx
rm src/routes/admin-rocker.tsx

# Unused login page (replaced by routes/auth.tsx)
rm src/pages/Login.tsx

# Duplicate SuperAndy (replaced by pages/SuperAndy/Index.tsx)
rm src/pages/SuperAndy.tsx
```

**Impact:** 5 files deleted, 0 broken routes  
**Reason:** These files have direct replacements already wired in App.tsx

---

## ⚠️ Investigate Then Delete (90% Confidence)

### Dashboard Versions (Pick ONE, delete the rest)
```bash
# Option A: Keep dashboard.tsx, delete others
rm src/routes/dashboard-v2.tsx
rm -rf src/routes/dashboard-new/

# Option B: Keep dashboard-new/, delete others
rm src/routes/dashboard.tsx
rm src/routes/dashboard-v2.tsx

# Option C: Keep dashboard-v2.tsx, delete others
rm src/routes/dashboard.tsx
rm -rf src/routes/dashboard-new/
```

**Action Required:** Determine which dashboard version is actively used, then delete the others  
**Impact:** 2 files + 1 directory deleted

---

## 🔍 Orphaned Route Files (Not Referenced in App.tsx)

### Admin Panel Orphans (28 files)
```bash
# These exist but aren't wired in App.tsx
# Verify they're not dynamically imported before deleting

rm src/routes/admin/a11y.tsx
rm src/routes/admin/audit.tsx
rm src/routes/admin/claims.tsx
rm src/routes/admin/components.tsx
rm src/routes/admin/control-room.tsx
rm src/routes/admin/features.tsx
rm src/routes/admin/routes.tsx
rm src/routes/admin/stub-backlog.tsx
rm src/routes/admin/system.tsx
rm src/routes/admin/tests.tsx
rm src/routes/admin/workers.tsx
rm -rf src/routes/admin/panels/  # 10 panel files
```

### Feature Orphans (20+ files)
```bash
rm src/routes/ai/activity.tsx
rm src/routes/app-store/index.tsx
rm src/routes/claim/[entityId].tsx
rm src/routes/compose.tsx
rm src/routes/crm/index.tsx
rm src/routes/_diag.tsx
rm src/routes/insights/index.tsx
rm src/routes/insights/[id].tsx
rm src/routes/live/[id].tsx
rm src/routes/live/create.tsx
rm src/routes/entities/[id]/activities.tsx
rm src/routes/entities/[id]/connections.tsx
rm src/routes/entities/[id]/insights.tsx
rm src/routes/events/create.tsx
rm src/routes/listings/create.tsx
rm src/routes/messages/[id].tsx
rm src/routes/profile/edit.tsx
```

### Farm Ops Suite (8 files - Keep or Delete All)
```bash
# If farm ops isn't used, delete entire suite
rm -rf src/routes/farm-ops/
```

### Dashboard Submodules (20+ files)
```bash
# If dashboard is consolidated, these may be unused
rm -rf src/routes/dashboard/modules/
rm -rf src/routes/dashboard/approvals/
rm -rf src/routes/dashboard/earnings/
rm -rf src/routes/dashboard/events/
rm -rf src/routes/dashboard/farm-ops/
rm -rf src/routes/dashboard/incentives/
rm -rf src/routes/dashboard/orders/
rm -rf src/routes/dashboard/overview/
```

**Total Orphaned:** ~100 files  
**Action Required:** Verify none are dynamically imported, then delete

---

## 📊 Cleanup Impact Summary

| Action | Files Deleted | Risk Level |
|--------|---------------|------------|
| Safe deletions | 5 files | ✅ Zero risk |
| Dashboard cleanup | 2-3 files | ⚠️ Low risk |
| Admin orphans | 28 files | ⚠️ Medium risk |
| Feature orphans | 20+ files | ⚠️ Medium risk |
| Farm ops suite | 8 files | ⚠️ Medium risk |
| Dashboard submodules | 20+ files | ⚠️ High risk |
| **TOTAL** | **~85 files** | - |

---

## 🔧 Cleanup Commands (Step by Step)

### Step 1: Safe Deletions (Do This Now)
```bash
# Delete replaced files
rm src/routes/rocker-hub.tsx
rm src/routes/super-andy.tsx
rm src/routes/admin-rocker.tsx
rm src/pages/Login.tsx
rm src/pages/SuperAndy.tsx

# Commit
git add -A
git commit -m "Remove replaced rocker/andy files"
```

### Step 2: Dashboard Consolidation (Do After Investigation)
```bash
# After determining active version, delete others
# Example: keeping dashboard.tsx
rm src/routes/dashboard-v2.tsx
rm -rf src/routes/dashboard-new/

git add -A
git commit -m "Consolidate dashboard to single version"
```

### Step 3: Admin Orphan Cleanup (Do After Verification)
```bash
# Verify no dynamic imports exist
grep -r "admin/a11y" src/
grep -r "admin/audit" src/
# ... check all admin orphans

# If safe, delete
rm src/routes/admin/a11y.tsx
rm src/routes/admin/audit.tsx
# ... delete all verified orphans

git add -A
git commit -m "Remove orphaned admin routes"
```

### Step 4: Feature Orphan Cleanup (Do After Verification)
```bash
# Check for dynamic imports
grep -r "app-store" src/
grep -r "compose" src/
# ... check all features

# If safe, delete
rm src/routes/app-store/index.tsx
rm src/routes/compose.tsx
# ... delete all verified orphans

git add -A
git commit -m "Remove orphaned feature routes"
```

---

## 🎯 Final Target Architecture

### Before Cleanup
```
39 routes in App.tsx
145+ route files
~100 orphaned files
Massive tech debt
```

### After Cleanup
```
39 routes in App.tsx (same)
~60 route files (58% reduction)
0 orphaned files
Tech debt: Reduced
```

### Future Phase (Overlay System)
```
10 canonical routes in App.tsx
~30 route files (80% reduction from current)
Everything else via ?app= overlays
Clean architecture achieved
```

---

## ⚡ Quick Scan Commands

### Find Dynamic Imports
```bash
# Check if any orphaned files are dynamically imported
grep -r "lazy(() => import" src/ | grep -E "(rocker-hub|super-andy|admin-rocker)"
```

### Find Component References
```bash
# Check if components are referenced elsewhere
grep -r "from.*rocker-hub" src/
grep -r "from.*super-andy" src/
grep -r "from.*admin-rocker" src/
```

### Find Dead CSS
```bash
# Find unused CSS classes (advanced)
find src/ -name "*.tsx" -exec grep -h "className=" {} \; | sort | uniq
```

---

## 🚨 Before Deleting Anything

1. **Search for imports:**
   ```bash
   grep -r "from '[path-to-file]'" src/
   ```

2. **Search for lazy loads:**
   ```bash
   grep -r "lazy(() => import('[path-to-file]')" src/
   ```

3. **Search for dynamic imports:**
   ```bash
   grep -r "import('[path-to-file]')" src/
   ```

4. **Check git history:**
   ```bash
   git log --follow --oneline [path-to-file]
   ```

5. **Run build:**
   ```bash
   pnpm build
   ```

6. **Run tests:**
   ```bash
   pnpm test
   ```

---

**Status:** Cleanup checklist created. Start with Step 1 (safe deletions), then proceed incrementally. Always verify before deleting.
