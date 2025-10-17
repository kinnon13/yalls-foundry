# Notification Preferences

**Status**: Full UI (Mock) | **Flag**: `notification_prefs` | **Owner**: Platform

## Overview

User-configurable delivery preferences for notifications, including channel toggles, category-specific settings, quiet hours, and daily caps.

## Settings

### Global Channels
- **In-app**: Always enabled (cannot disable)
- **Email**: Opt-in, respects quiet hours
- **Push**: Opt-in, requires permission
- **SMS**: Opt-in, premium feature

### Category Overrides
Per-lane customization:
- Priority: Default all channels enabled
- Social: Default in-app only
- System: Default in-app + email

### Quiet Hours
- **Format**: HH:mm (local time)
- **Default**: 22:00 – 08:00
- **Scope**: Blocks email, push, SMS (in-app unaffected)

### Daily Cap
- **Range**: 10 – 100 notifications/day
- **Default**: 50
- **Behavior**: After cap, queue for digest

## UI Components

- **Settings page**: `/settings/notifications`
- **Toggle switches** with `role="switch"` + `aria-checked`
- **Time pickers** for quiet hours
- **Slider** for daily cap with live value display

## Data Structure

```typescript
{
  user_id: uuid,
  channels: { in_app, email, push, sms },
  categories: {
    priority: { in_app, email, push, sms },
    social: { ... },
    system: { ... }
  },
  quiet_hours: { start: "22:00", end: "08:00" },
  daily_cap: 50,
  digest_frequency: "off" | "daily" | "weekly",
  updated_at: timestamp
}
```

## Persistence

- Mock: localStorage (namespaced by user)
- DB: `notification_prefs` table with RLS

## Accessibility

- All toggles use `aria-pressed` or `role="switch"`
- Form inputs have associated `<Label>` elements
- Quiet hours have local-time hint
- Slider shows current value in heading

## Testing

See: `tests/e2e/notifications.prefs.spec.ts`

## Rollout

1. Deploy with `notification_prefs=true` (mock)
2. Add DB migration for prefs table
3. Flip to DB mode
4. Monitor opt-in/out rates per channel
