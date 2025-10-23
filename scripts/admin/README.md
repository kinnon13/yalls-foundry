# Admin Dashboard Layer

Ensures admin dashboard can parse all scan output schemas correctly.

## Scripts

- **verify-admin-schema.ts** - Validates all JSON reports match expected schema

## Usage

```bash
# Verify dashboard schemas
deno run -A scripts/admin/verify-admin-schema.ts
```

## Reports

All outputs → `scripts/audit/admin-schema-results.json`
