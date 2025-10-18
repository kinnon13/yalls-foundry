# 10-Section Architecture Lockdown

## Overview
This app is **locked to exactly 10 hard-wired sections** to keep it organized, AI-ready, and easy to customize.

## The 10 Sections (Final)

1. **Discovery** — `/search`, `/feed`
   - Public search and personalized feed

2. **Marketplace** — `/marketplace` (+ `/cart`, `/orders`)
   - Browse listings, shopping cart, order management

3. **Profiles** — `/entities/:id`, `/u/:handle`, `/entities/unclaimed`
   - Public profiles, unclaimed capture & claim flow, profile posts inline

4. **EquineStats** — `/equinestats/*` (public), `/workspace/:entityId/equinestats` (private)
   - Public performance pages and owner-only analytics in workspace

5. **Events (Public)** — `/events`, `/events/:slug` (+ `/draw`, `/results`)
   - Public event catalog, details, draws, and results

6. **My Entries** — `/entries/*`
   - Entrant view: my entries, draws, and results

7. **Workspace Home** — `/workspace/:entityId/dashboard`
   - Producer dashboard with live KPIs, NBA tray, Theme broker

8. **Producer Events** — `/workspace/:entityId/events/*`
   - Create, manage, check-in for event producers

9. **Programs** (was Incentives) — `/workspace/:entityId/programs`
   - Attach to events, manage rules and payouts

10. **Messaging** — `/workspace/:entityId/messages`
    - DM threads and notifications

## Deferred (Out of Scope)
CRM, Farm, Admin, Stallions, Tours, etc. are kept behind redirects/flags so the scanner stops counting them as active sections.

## Route Structure

### Public Heads
- `/search`
- `/marketplace`
- `/entities/*`
- `/equinestats/*`
- `/events/*`

### Private Heads
- `/feed`
- `/cart`
- `/orders`
- `/entries/*`

### Workspace Head
- `/workspace/:entityId/*` (subpages: dashboard, events, programs, messages, equinestats)

## Route Aliases (Preserved)
```json
{
  "/organizer/*": "/workspace/:entityId/events/*",
  "/incentives/dashboard": "/workspace/:entityId/programs",
  "/dashboard": "/workspace",
  "/entrant": "/entries",
  "/equistats/*": "/equinestats/*",
  "/crm": "/workspace/:entityId/dashboard"
}
```

## What Gets Wired in Each Section

### Profiles
- `/entities/:id` shows profile + posts tab
- `/entities/unclaimed` capture panel: "Know this person? Suggest owner / claim"
- Claim flow links to `/claim/:id`

### EquineStats
- Public pages live at `/equinestats/*`
- Private owner analytics at `/workspace/:entityId/equinestats`

### Workspace Home
- **KpiTiles** (Revenue, Orders, Entries, Views) using `get_workspace_kpis`
- **ThemeBroker** mounted; user can say "make mine purple" → `set_theme_overrides`
- Optional **NBATray** if flag enabled

### Producer Events
- Create/manage/check-in
- Programs attach to events

### Programs
- Incentives renamed; alias preserved
- RPC stays `attach_incentive_to_event` until DB rename

### Messaging
- `/workspace/:entityId/messages` wired with `dm_send`

## Core RPCs Used by the 10
- `get_workspace_kpis(entity_id, horizon)`
- `set_theme_overrides(subject_type, subject_id, tokens)` / `get_theme(...)`
- `entry_submit(...)` (entrant flow)
- `dm_send(...)` (messaging)
- `attach_incentive_to_event(...)` (Programs until rename)

RLS stays as configured (members/owner/admin). Nothing new required.

## CI Guardrails

### 1. 10-Head Limit Check
```bash
node scripts/validate-architecture.mjs
```
Fails if `collapsedHeads` exceeds 10 sections.

### 2. Route Coverage Check
```bash
node scripts/validate-main-routes.mjs
```
Verifies App.tsx routes match `collapsedHeads` from config.

### 3. Catalog Coverage
```bash
node scripts/validate-catalog-coverage.mjs
```
Only counts items within the 10 sections. Ignores legacy folders:
- `src/legacy/**`
- `docs/**`
- `migrations/**`

### 4. Admin/Deferred Routes
Treat `/admin`, `/farm`, `/stallions`, `/tours` as aliases → workspace (no new heads).

## Definition of Done (for this cut)

✅ Only the 10 sections above appear in nav/scanner  
✅ All route aliases resolve to these 10; no new heads  
✅ Profiles show posts and unclaimed capture  
✅ Workspace Home shows live KPIs; Theme changes apply instantly  
✅ Undocumented items inside these 10 = 0 (others ignored/aliased)  
✅ CI passes with "≤10 heads" check + legacy remap guard  

## Running All Checks (On-Demand)

```bash
# Run all validation scripts
npm run validate:all

# Or individually
node scripts/validate-architecture.mjs
node scripts/validate-main-routes.mjs
node scripts/validate-catalog-coverage.mjs
node scripts/security-audit.sql
```

## Common Fixes

### Adding a New Section
**Don't.** The 10-section limit is enforced by CI. If you need a new top-level page:
1. Consolidate under an existing section (e.g., add to workspace)
2. Use query params (e.g., `/dashboard?m=new-module`)
3. Propose replacing an existing section

### Moving a Route
1. Update `configs/area-discovery.json` with new alias
2. Update `routeCategories` if visibility changes
3. Run `node scripts/validate-architecture.mjs`

### Hiding a Legacy Feature
1. Add route alias pointing to appropriate section
2. Add to ignore patterns in scanner
3. Set feature flag to `off` in config

## Configuration File

All sections, aliases, and flags are defined in:
```
configs/area-discovery.json
```

## References
- [Security Audit](./SECURITY_README.md)
- [RPC Testing](./scripts/test-rpc-contracts.sql)
- [Catalog Backfill](./scripts/catalog-backfill.mjs)
