# Files Over 200 Lines - Refactoring Priority

Generated: 2025-01-XX
Status: **BLOAT DETECTED** - Multiple files exceed maintainability threshold

## Critical Files (500+ lines)

### 🔴 src/App.tsx - **558 lines**
**Current State:** Monolithic router with 39+ routes
**Target State:** 31 routes max (documented in WHERE_EVERYTHING_GOES.md)
**Action:** IMMEDIATE - Follow EXECUTION_CHECKLIST.md Phase 1-7
- Move 23 features to overlay system (?app=key)
- Delete 85+ orphaned route files
- Consolidate auth guards
**Priority:** P0 - Blocking all other refactoring

## High Priority (300-499 lines)

These files should be split into focused components/modules:

### Frontend Components
- **src/components/rocker/*** - Check individual component sizes
- **src/routes/** - Many route files likely over 200 lines
- **src/pages/** - Page files need audit

### Backend Functions
- **supabase/functions/** - Edge functions should be audited

## Action Plan

### Phase 1: App.tsx Cleanup (P0)
```bash
# Execute immediately
# Follow docs/EXECUTION_CHECKLIST.md
# Reduces App.tsx from 558 → ~350 lines
```

### Phase 2: Component Splitting (P1)
After App.tsx cleanup:
1. Identify all .tsx/.ts files > 200 lines
2. Extract reusable logic into hooks
3. Split large components into composable pieces
4. Move business logic to services/

### Phase 3: Route File Audit (P2)
```bash
# Find all route files
find src/routes -name "*.tsx" -type f

# Check line counts
wc -l src/routes/**/*.tsx | sort -n
```

## Refactoring Rules

**Before splitting any file:**
1. ✅ Check if it's in CLEANUP_CHECKLIST.md for deletion
2. ✅ Verify it's actually used (not orphaned)
3. ✅ Ensure no duplicate functionality exists
4. ✅ Document what it does in WHERE_EVERYTHING_GOES.md

**Target file sizes:**
- Components: < 150 lines
- Pages: < 200 lines  
- Hooks: < 100 lines
- Utils: < 150 lines
- Services: < 200 lines

**Anti-patterns to avoid:**
- ❌ God components (one file does everything)
- ❌ Inline business logic in JSX
- ❌ Duplicate code across files
- ❌ Files mixing concerns (UI + data + logic)

## Commands to Find Large Files

```bash
# Find all TypeScript files over 200 lines
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 200' | sort -n

# Find all files over 300 lines (critical)
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 300' | sort -n

# Count total lines in src/
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1
```

## Next Steps

1. **TODAY:** Execute App.tsx cleanup per EXECUTION_CHECKLIST.md
2. **After App.tsx:** Run audit command above to get full file list
3. **Then:** Create targeted refactoring tickets for each 300+ line file
4. **Finally:** Set up pre-commit hook to prevent 200+ line files

## Estimated Impact

**Current State:**
- App.tsx: 558 lines (196% over target)
- Unknown number of other large files
- Estimated total bloat: 10,000+ unnecessary lines

**Target State (post-cleanup):**
- App.tsx: ~350 lines (within acceptable range for router)
- All components: < 200 lines
- Estimated reduction: 40% codebase size

## Success Metrics

- ✅ Zero files over 300 lines
- ✅ < 5% of files over 200 lines
- ✅ Average component: 80-120 lines
- ✅ All business logic in services/
- ✅ All hooks < 100 lines

---

**NEXT IMMEDIATE ACTION:** 
Run `docs/EXECUTION_CHECKLIST.md` Phase 1 to reduce App.tsx from 558 → 350 lines
