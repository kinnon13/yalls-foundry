# Validation Scripts

**Last Updated:** 2025-10-22

## Purpose

Scripts for validating system integrity, database state, specifications, and functional tests.

## Scripts

### spec-gate.cjs
Gate-checks that all files defined in a spec JSON exist before allowing builds to proceed.

**Usage:**
```bash
node scripts/validation/spec-gate.cjs specs/day1-auth-rbac-profiles.json
```

### validate-db.sql
SQL-based validation of database schema, functions, and RLS policies.

**Usage:**
```bash
psql $DATABASE_URL -f scripts/validation/validate-db.sql
```

### test-kb.sh
End-to-end test of knowledge base ingestion and search system.

**Usage:**
```bash
export VITE_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"
./scripts/validation/test-kb.sh
```

## Validation Standards

- All validation scripts must exit with code 0 on success
- Exit code 1 indicates validation failure
- Exit code 2 indicates missing prerequisites
- All failures must print actionable error messages
- Scripts should support both local and CI environments

## CI Integration

These scripts are run automatically in CI pipelines to ensure:
- Spec compliance before merge
- Database integrity after migrations
- Functional correctness of critical paths

See `.github/workflows/` for integration examples.
