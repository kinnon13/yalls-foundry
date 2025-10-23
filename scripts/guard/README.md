# Guard Layer - Pre-Flight Verification

Critical architecture integrity checks that run before commits and in CI.

## Scripts

- **verify-structure.ts** - Ensures all required files exist
- **verify-supabase-config.ts** - Validates function registration
- **verify-modules.ts** - Checks module independence

## When They Run

- **Pre-commit** - Via Husky hooks
- **CI/CD** - On every push/PR
- **Manual** - `npm run guard`

## Purpose

Prevents architectural violations from entering the codebase.
