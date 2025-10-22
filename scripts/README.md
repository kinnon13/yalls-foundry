# Scripts Directory

**Last Updated:** 2025-10-22

## Overview

The `/scripts` directory contains all automation, validation, auditing, and operational scripts organized by purpose.

## Directory Structure

```
scripts/
├── health/          # Health checks and diagnostic reports
├── audit/           # Security audits and RLS verification
├── validation/      # Spec compliance and functional tests
├── fixes/           # Automated code quality improvements
└── database/        # Database migrations, seeding, and trains
```

## Subdirectories

### 📊 [health/](./health/)
System health monitoring and diagnostic report generation.
- `generate-report.mjs` - Main health report generator

### 🔒 [audit/](./audit/)
Security auditing and compliance verification.
- `verify-rls.sh` - RLS policy verification wrapper
- `rls_test.sql` - SQL-based RLS test suite

### ✅ [validation/](./validation/)
Spec compliance, schema validation, and functional tests.
- `spec-gate.cjs` - Pre-build spec compliance check
- `validate-db.sql` - Database schema validation
- `test-kb.sh` - Knowledge base system test

### 🔧 [fixes/](./fixes/)
Automated refactoring and code quality fixes.
- `apply-all-fixes.sh` - Master fix orchestrator
- `fix-hardcoded-tenants.ts` - Tenant ID hardcode removal

### 🗄️ [database/](./database/)
Database operations, migrations, and seeding.
- `apply-migrations.sh` - Migration application script
- `create-train.sh` - Migration train creator
- `seed-phase1.ts` - Initial data seeding
- `demo-enqueue.ts` - Job queue demonstration

## Quick Start

### Run Health Check
```bash
DATABASE_URL="postgres://..." node scripts/health/generate-report.mjs
```

### Verify RLS Policies
```bash
STAGING_DB="postgres://..." ./scripts/audit/verify-rls.sh
```

### Validate Spec Compliance
```bash
node scripts/validation/spec-gate.cjs specs/day1-auth-rbac-profiles.json
```

### Apply Database Migrations
```bash
DATABASE_URL="postgres://..." ./scripts/database/apply-migrations.sh
```

## CI Integration

All scripts are designed for both local development and CI environments:

```yaml
# Health checks
- name: Health Report
  run: node scripts/health/generate-report.mjs
  
# Security audit
- name: RLS Verification
  run: ./scripts/audit/verify-rls.sh
  env:
    STAGING_DB: ${{ secrets.STAGING_DB }}
    
# Spec compliance
- name: Validate Architecture
  run: node scripts/validation/spec-gate.cjs
```

## Script Standards

All scripts in this directory must:
- ✅ Have clear, descriptive names
- ✅ Include usage documentation in README
- ✅ Exit with proper status codes (0=success, 1=failure, 2=critical)
- ✅ Print actionable error messages
- ✅ Support both local and CI environments
- ✅ Be idempotent when possible

## Adding New Scripts

1. Place in appropriate subdirectory based on purpose
2. Add documentation to subdirectory README
3. Update this main README if needed
4. Add CI integration if applicable
5. Follow naming conventions (kebab-case for bash, camelCase for TS/JS)

## Deprecated Scripts

Historical scripts are moved to `/archive/old-scripts/` with deprecation headers.
See [archive README](../archive/old-scripts/README.md) for restoration procedures.
