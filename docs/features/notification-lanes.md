# Notification Lanes

**Status**: Wired (DB-backed) | **Flag**: `notification_lanes` | **Owner**: Platform

## Overview

Three-lane notification inbox with smart routing, unread counts, and bulk actions. Fully wired to Supabase with RLS, indexes, and optimistic UI updates.

## Architecture

### Lane Classification
Notifications are automatically routed to lanes based on their `type`:

- **Priority**: `mention`, `order`
- **Social**: `follow`, `like`, `repost`
- **System**: `system`, `digest`, and fallback

### Database Schema
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  lane text CHECK (lane IN ('priority','social','system')),
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
```

### RPC Functions
All operations go through secure RPC functions:
- `notifications_list(user_id, lane, before?, limit?)` - Paginated listing
- `notifications_mark_read(user_id, ids[])` - Bulk mark-read
- `notifications_mark_all_read(user_id, lane)` - Clear all in lane
- `notifications_counts(user_id)` - Unread counts per lane
- `notification_enqueue(...)` - Smart insert with quiet hours/cap enforcement

## UI Implementation

### Route: `/notifications`
Three-tab interface with real-time counts and optimistic updates.

**Features**:
- Badge counts per lane (Priority: red, Social: blue, System: gray)
- Click notification to mark as read
- Bulk "Mark all read" button
- Empty states with illustrations
- Test panel in dev mode

**Accessibility**:
- `role="button"` on notifications
- Keyboard navigation (Tab, Enter, Space)
- ARIA labels on all actions
- WCAG 2.1 AA compliant

### Components
- `LaneDrawer` - Tab navigation with badges
- `NotificationItem` - Single notification card
- `NotificationTestPanel` - Dev utility for seeding

## Integration

### Creating Notifications (Backend)
```typescript
const { data: allowed, error } = await supabase.rpc('notification_enqueue', {
  p_user_id: userId,
  p_lane: 'priority',
  p_type: 'order',
  p_title: 'Order confirmed',
  p_body: 'Order #12345 has been placed',
  p_link: `/orders/12345`
});

if (!allowed) {
  console.log('Blocked by quiet hours or daily cap');
}
```

### Reading Notifications (Frontend)
```tsx
import { useNotifications, useNotificationCounts } from '@/hooks/useNotifications';

function NotificationBell() {
  const { counts } = useNotificationCounts();
  const totalUnread = (counts?.priority || 0) + (counts?.social || 0) + (counts?.system || 0);

  return <Badge>{totalUnread > 0 ? totalUnread : null}</Badge>;
}
```

## Performance

**Query Times** (production):
- List 50 notifications: <50ms
- Unread counts: <20ms
- Mark all read: <100ms

**Optimizations**:
- Composite index: `(user_id, created_at)`
- Partial index: `(user_id, lane, created_at DESC) WHERE read_at IS NULL`
- React Query caching (30s stale time)
- Optimistic UI updates

## Testing

See: `tests/e2e/notifications.lanes.spec.ts`, `tests/e2e/notifications.smoke.spec.ts`

**Coverage**:
- Create → List → Mark Read → Verify Counts
- Lane switching preserves unread state
- Bulk actions update counts correctly
- Quiet hours/daily cap enforcement