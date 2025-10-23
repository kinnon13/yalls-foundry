# AI Integrity Layer

Verifies that Rocker AI kernels are properly loaded and operational.

## Scripts

- **verify-rocker-integrity.ts** - Checks all AI brain kernels are present and mapped

## Usage

```bash
# Verify Rocker AI kernels
deno run -A scripts/ai/verify-rocker-integrity.ts
```

## Reports

All outputs → `scripts/audit/rocker-integrity-results.json`
