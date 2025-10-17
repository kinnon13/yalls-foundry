# Feature Mapping System

## Overview

Complete tracking system for all 87 features across the codebase, from Shell → Full UI → Wired.

## Tools

### Admin Dashboards

- **`/admin/features`**: View, filter, sort all features with status, routes, components, tests
- **`/admin/routes`**: Route manifest with feature/flag mappings
- **`/admin/components`**: Component registry with @feature() tags
- **`/admin/a11y`**: Accessibility scan results per route
- **`/admin/tests`**: Test coverage by feature

### Dev HUD

Toggle with `?dev=1` or **Ctrl+Shift+D**

Shows for current route:
- Route path
- Features detected (with Shell/Full UI/Wired status)
- A11y quick scan (violation count)
- Recent analytics events (last 10s)
- Quick links to admin dashboards

### CLI Scripts

```bash
# Generate all manifests
npm run map

# Watch mode (auto-regenerate on file changes)
npm run map:watch

# Open feature details
npm run feature:open profile_pins
```

## Feature Status Levels

- **Shell**: Route + minimal UI, no business logic
- **Full UI**: Complete UI, mock adapter, tests, docs
- **Wired**: Connected to DB via RPC, production-ready

## Annotations

Tag files with:

```typescript
/**
 * @feature(profile_pins)
 */
```

Scanner auto-discovers components, routes, tests for each feature.

## Data Files

- **`docs/features/features.json`**: Source of truth (87 features)
- **`generated/route-manifest.json`**: Routes → features/flags
- **`generated/component-registry.json`**: Components → features
- **`generated/a11y-report.json`**: Axe scan results

## Switching Adapters

```bash
# Mock mode (localStorage)
VITE_PORTS_MODE=mock

# DB mode (Supabase RPC)
VITE_PORTS_MODE=db
```

Single env var flips all ports instantly.

## CI Gates

GitHub Action `.github/workflows/map-verify.yml` fails if:
- Any of 87 features missing from `features.json`
- Gold-path features not at "full-ui" or "wired"

## Rollout Workflow

1. Build feature with mock adapter (status: "full-ui")
2. Write DB migration + RPC stubs
3. Wire DB adapter
4. Update status to "wired"
5. Deploy + flip `VITE_PORTS_MODE=db`

## Observability

- Feature flags tracked in `/admin/features`
- Route coverage in `/admin/routes`
- Component usage in `/admin/components`
- A11y compliance in `/admin/a11y`
- Test coverage in `/admin/tests`

## Quick Commands

```bash
# See what exists for a feature
npm run feature:open notification_lanes

# Check coverage gates
npm run verify:product

# Update manifests
npm run map
```
