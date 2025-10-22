# Fix Scripts

**Last Updated:** 2025-10-22

## Purpose

Automated scripts for applying systematic fixes, refactors, and code quality improvements across the codebase.

## Scripts

### apply-all-fixes.sh
Master script that orchestrates all billion-user quality fixes in sequence.

**Usage:**
```bash
./scripts/fixes/apply-all-fixes.sh
```

**What it does:**
1. Fixes hardcoded tenant IDs
2. Replaces console.log with structured logger
3. Applies rate limiting to edge functions
4. Runs verification checks

### fix-hardcoded-tenants.ts
Scans edge functions for hardcoded zero-UUID tenant IDs and replaces them with runtime tenant extraction.

**Usage:**
```bash
deno run -A scripts/fixes/fix-hardcoded-tenants.ts
```

**Safety:**
- Only modifies edge function files
- Automatically injects required imports
- Preserves existing functionality
- Skips files in SKIP list

## Fix Standards

- All fixes must be idempotent (safe to run multiple times)
- Must preserve existing functionality
- Should include verification step
- Must not require manual intervention
- Should log all changes for audit trail

## Before Running Fixes

1. Commit current state to version control
2. Review which files will be affected
3. Ensure tests pass before applying fixes
4. Have rollback plan ready

## After Running Fixes

1. Review changes with `git diff`
2. Run full test suite
3. Verify lint passes
4. Check type safety
5. Commit with descriptive message
