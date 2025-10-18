# Health Check System

Comprehensive health validation for the AI-first platform architecture.

## Quick Start

```bash
# Install pg driver (required for DB checks)
npm install pg

# Generate health report
node scripts/health/generate-report.mjs

# View results
cat health-report.json
```

## What Gets Checked

### Repo Structure (`check-repo.mjs`)
- **Required files**: ThemeBroker.tsx, tokens.css, KpiTiles.tsx, redirects.ts
- **Config validation**: area-discovery.json structure and required keys
- **Route aliases**: All 6 canonical redirects (organizer→workspace, etc.)
- **Collapsed heads**: Must include `/equinestats`
- **Legacy references**: Scans codebase for stray `/equistats` refs

### Database (`check-db.mjs`)
- **Required tables**: user_segments, entity_segments, ui_theme_overrides
- **RLS policies**: PII tables (profiles, orders, payments, etc.) must have RLS enabled
- **Required RPCs**: recommend_workspace_modules, set_theme_overrides, get_theme, get_workspace_kpis
- **Security**: SECURITY DEFINER flag on all control plane RPCs
- **Smoke test**: JSON transform capability

## Severity Levels

- **CRITICAL**: Breaks spec or security (missing RLS, wrong SECURITY DEFINER, missing tables/RPCs)
- **WARNING**: Legacy refs, arg-count drift, optional checks
- **INFO**: Confirmations (files present, structure valid)

## CI Integration

The `.github/workflows/health-report.yml` workflow:
1. Runs on every PR
2. Validates architecture config
3. Generates health report
4. Posts summary comment with top issues
5. Uploads full `health-report.json` as artifact

## Environment

Set `DATABASE_URL` secret in GitHub repo settings for CI DB checks.

Locally:
```bash
export DATABASE_URL="postgresql://..."
node scripts/health/generate-report.mjs
```

## Exit Codes

- `0`: All checks passed or warnings only
- `2`: Critical issues found (blocks CI)
