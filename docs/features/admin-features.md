# Admin Feature Index

**Status**: Full UI | **Flag**: `admin_features` | **Owner**: Platform

## Overview

Central dashboard for tracking all 87 features across the application. Provides filtering, sorting, progress tracking, and quick access to routes/components/tests/docs for each feature.

## Features

### Summary View
- Total feature count
- % complete (Full UI + Wired / Total)
- Breakdown by status: Shell, Full UI, Wired

### Progress by Area
Progress bars for each area:
- Profile (5 features)
- Notifications (3 features)
- Composer (4 features)
- Events (12 features)
- Producer (8 features)
- Earnings (6 features)
- AI (17 features)

### Filters
- **Search**: Title or feature ID
- **Area**: Profile, Notifications, Composer, Events, Producer, Earnings, AI
- **Status**: Shell, Full UI, Wired
- **Owner**: Web, Platform
- **Severity**: P0, P1, P2

### Feature Table
Columns:
- Feature (title + ID)
- Status (color-coded badge)
- Owner
- Route count
- Component count
- Test count
- Actions (open route, view docs, view tests, view components)

## Data Source

`docs/features/features.json` - single source of truth

Schema per feature:
```json
{
  "id": "profile_pins",
  "area": "profile",
  "title": "Profile Pins",
  "status": "full-ui",
  "routes": ["/profile/:id"],
  "components": ["src/components/profile/pins/PinBoard.tsx"],
  "rpc": ["profile_pins_get", "profile_pins_set"],
  "flags": ["profile_pins"],
  "docs": "docs/features/profile-pins.md",
  "tests": {
    "unit": [],
    "e2e": ["tests/e2e/profile.pins.spec.ts"]
  },
  "owner": "web",
  "severity": "p0",
  "notes": ""
}
```

## Workflows

### Check feature status
1. Visit `/admin/features`
2. Search or filter to find feature
3. Review status badge and coverage

### Update feature metadata
1. Edit `docs/features/features.json` directly
2. Run `npm run map` to regenerate manifests
3. Refresh admin page

### Jump to feature code
1. Click route icon → opens route in new tab
2. Click docs icon → opens feature docs
3. Click tests icon → shows test files
4. Click code icon → shows components

## Accessibility

- Semantic table with proper headers
- Keyboard-navigable filters
- Links have descriptive aria-labels
- Progress bars have text alternatives

## Testing

Covered in `tests/a11y/global.spec.ts` (axe scan)

## Gold-Path Features

Must be "full-ui" or "wired" for CI to pass:
- profile_pins, favorites, reposts, linked_accounts, entity_edges
- composer_core, composer_crosspost, composer_schedule
- notification_lanes, notification_prefs, notification_digest
- events_discounts, events_waitlist
- producer_console_overview, producer_registrations, producer_financials, producer_export_csv
- earnings_tiers, earnings_missed, orders_refund_flow
- ai_context_compiler, ai_memory, ai_nba_ranker, ai_modal, ai_explainability
