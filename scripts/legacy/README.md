# Legacy Scripts

This directory contains scripts that are not part of the core Mission Control Stack but may still be useful for specific tasks.

## Contents

### Feature Management
- `backfill-features.ts` - Feature backfill generator
- `feature-open.ts` - Feature CLI tool
- `scan-features.ts` - Feature scanner
- `scan-components.ts` - Component scanner
- `scan-routes.ts` - Route scanner

### Supabase Utilities
- `cleanup-duplicates.ts` - Duplicate function cleanup
- `generate-bridges.ts` - Bridge function generator
- `restore-ghost-functions.ts` - Ghost function restoration
- `scan-cross-dependencies.ts` - OLD cross-dependency scanner (v1)

### Rocker Diagnostics
- `rocker-doctor.ts` - Rocker AI wiring audit
- `rocker-memory-doctor.ts` - Memory health check

### Catalog & Documentation
- `catalog-backfill.mjs` - Catalog stub generator
- `catalog-sync.mjs` - Catalog sync tool
- `ops-report.mjs` - Database coverage analysis

### Code Quality
- `a11y-smoke.mjs` - Accessibility smoke tests
- `ai-guards.mjs` - AI guardrails checker
- `count-large-files.mjs` - Large file counter
- `generate-large-files-report.mjs` - Large file reporter
- `remap-legacy.mjs` - Legacy route remapper
- `scaffold-apps.mjs` - App scaffolding generator

### Build & Deploy
- `ai_audit.sh` - Platform audit suite (OLD)
- `archive.sh` - Safe file archival
- `billion-user-fixes.sh` - Quality fixes automation
- `verify-install.ts` - Installation verifier

## Usage

These scripts are archived but can still be run if needed. They are not part of the automated Mission Control verification system.

To use any of these:
```bash
deno run -A scripts/legacy/<script-name>
# or
node scripts/legacy/<script-name>
# or
bash scripts/legacy/<script-name>
```

## Note

The core Mission Control Stack uses the following structure instead:
- `scripts/guard/` - Pre-flight verification
- `scripts/scan/` - Automated scanning
- `scripts/audit/` - Integrity checks
- `scripts/health/` - Live health monitoring
- `scripts/ai/` - AI verification
- `scripts/admin/` - Admin schema checks
- `scripts/lib/` - Shared utilities