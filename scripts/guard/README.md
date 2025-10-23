# Guard Layer - Pre-Flight Verification

Critical architecture integrity checks that run before commits and in CI.

## Scripts

- **verify-structure.ts** - Ensures all required directories exist
- **verify-supabase-config.ts** - Validates function registration against config.toml
- **verify-modules.ts** - Checks for broken or risky module imports
- **verify-mission-integrity.ts** ⭐ - Full stack verifier with telemetry logging

## Usage

```bash
# Run full mission integrity check (recommended)
deno run -A scripts/guard/verify-mission-integrity.ts

# Run all guards via quick check
./scripts/guard-quick-check.sh

# Individual checks
deno run -A scripts/guard/verify-structure.ts
deno run -A scripts/guard/verify-supabase-config.ts
deno run -A scripts/guard/verify-modules.ts
```

## When They Run

- **Pre-commit** - Via Husky hooks (.husky/pre-commit)
- **CI/CD** - On every push/PR (.github/workflows/mission-integrity.yml)
- **Manual** - `npm run verify` or `npm run scan:guard`

## Mission Integrity Verifier

The `verify-mission-integrity.ts` script is the most comprehensive guard:
- Verifies all expected files exist
- Detects unexpected/orphan scripts
- Runs `deno check` for syntax validation
- Logs results to `scripts/audit/integrity-history.json`
- Exits with code 0 (GO) or 1 (NO-GO)

## Purpose

Prevents architectural violations from entering the codebase and maintains Mission Control Stack integrity.
