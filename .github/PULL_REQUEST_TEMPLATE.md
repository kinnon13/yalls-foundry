## Route Consolidation (Archive-first)

**Goal:** Reduce App.tsx routes from 39 → ~31, move non-canonical features to overlays.  
**Safety:** No hard deletes; all files moved to `src/__archive__/YYYY-MM-DD/`.

---

### Changes

- [ ] ✅ Archived replaced rocker/andy files
- [ ] ✅ Selected single dashboard implementation
- [ ] ✅ Removed overlay/admin extras from App.tsx
- [ ] ✅ Overlay access via `/?app=...` system
- [ ] ✅ Documentation updated

### Metrics

- **Routes before:** 39
- **Routes after:** <!-- grep -c 'path=' src/App.tsx -->
- **Files archived:** <!-- find src/__archive__ -type f | wc -l -->
- **Archive location:** `src/__archive__/YYYY-MM-DD/`

---

### Verification Checklist

- [ ] `pnpm build` passes
- [ ] `grep -c 'path=' src/App.tsx` shows ~31
- [ ] Key pages load:
  - [ ] `/` (Home)
  - [ ] `/dashboard`
  - [ ] `/rocker` (User Rocker)
  - [ ] `/super-andy` (Super Andy)
  - [ ] `/admin-rocker` (Admin Rocker)
  - [ ] `/super/*` (Super Console)
- [ ] `pnpm exec playwright test` passes
- [ ] No console errors on key pages
- [ ] Overlay system works: `/?app=mlm`, `/?app=crm`, `/?app=farm-ops`

---

### Testing Instructions

1. **Clone and checkout:**
   ```bash
   git checkout chore/route-consolidation-archive
   pnpm install
   ```

2. **Run build:**
   ```bash
   pnpm build
   ```

3. **Start dev server:**
   ```bash
   pnpm dev
   ```

4. **Test routes manually:**
   - Visit each key route listed above
   - Try overlay routes: `/?app=mlm`, `/?app=crm`
   - Check that archived pages don't render

5. **Run E2E tests:**
   ```bash
   pnpm exec playwright test
   ```

---

### Rollback Plan

If issues arise after merge:

1. **Immediate rollback via Git:**
   ```bash
   git revert HEAD~5..HEAD
   ```

2. **Restore specific files:**
   ```bash
   git mv src/__archive__/YYYY-MM-DD/[file] src/routes/[file]
   ```

3. **Restore routes in App.tsx:**
   - Add back the removed route entries
   - Redeploy

All archived files remain in `src/__archive__/` for easy restoration.

---

### Related Issues

<!-- Link to GitHub issues or tickets -->

- Closes #XXX
- Related to #YYY

---

### Screenshots

<!-- Add before/after screenshots if relevant -->

**Before:**
<!-- Route count, app structure -->

**After:**
<!-- Cleaner App.tsx, overlay system working -->

---

### Deployment Notes

- No database migrations required
- No environment variable changes
- Safe to merge and deploy immediately
- Monitor for broken links or 404s after deploy

---

### Reviewer Checklist

- [ ] Code changes reviewed
- [ ] Tests pass locally
- [ ] CI/CD pipeline passes
- [ ] No new console errors
- [ ] Overlay system functional
- [ ] Documentation adequate
- [ ] Rollback plan clear
