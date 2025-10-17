# Notification Lanes

**Status**: Full UI (Mock) | **Flag**: `notification_lanes` | **Owner**: Platform

## Overview

Notification lanes organize notifications into three priority-based categories: Priority, Social, and System. Each lane has independent badge counts and mark-read actions.

## Lanes

### Priority
- **Contents**: Mentions, orders, critical alerts
- **Delivery**: Real-time in-app, optional email/push
- **User control**: Cannot disable, can configure channels

### Social
- **Contents**: Follows, likes, reposts, comments
- **Delivery**: In-app by default, batch-friendly
- **User control**: Full channel customization

### System
- **Contents**: Product updates, maintenance, security
- **Delivery**: In-app, occasional email digest
- **User control**: Cannot disable in-app, can disable email

## UI Components

- **LaneDrawer**: Three-tab interface with badge counts
- **NotificationItem**: Single notification with keyboard support (Enter=open, r=mark read, Space=select)
- **Batch actions**: Mark selected read, mark all read per lane

## Data Flow

```
Mock: localStorage namespaced by user + lane
DB: notifications table with lane column + RLS
```

## Classification Logic (Mock)

```typescript
mention | order → priority
follow | like | repost → social
system | digest → system
```

## Accessibility

- `role="tablist"` with `aria-selected` and `aria-controls`
- Badge counts update via `aria-live="polite"`
- Keyboard navigation: left/right arrows between lanes
- Focus trap in drawer, Escape to close

## Testing

See: `tests/e2e/notifications.lanes.spec.ts`

## Rollout

1. Deploy with `notification_lanes=true` (mock)
2. Run DB migration for lanes + RLS
3. Flip `VITE_PORTS_MODE=db`
4. Monitor lane distribution in analytics
