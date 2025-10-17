# Notification Digest

**Status**: Full UI (Mock) | **Flag**: `notification_digest` | **Owner**: Platform

## Overview

Daily or weekly email summary of unread notifications, grouped by lane. Reduces notification fatigue while keeping users informed.

## Frequencies

- **Off** (default): No digest
- **Daily**: Sent at 8:00 AM local time
- **Weekly**: Sent Monday 8:00 AM local time

## Content Structure

```
Subject: Your [Daily|Weekly] Digest – 12 unread notifications

Body:
  Priority (3)
    - [Title + Body + Link]
    - ...
  
  Social (8)
    - ...
  
  System (1)
    - ...
```

## UI Components

- **Frequency selector**: Dropdown on settings page
- **Preview button**: Opens DigestPreview modal
- **Send test button**: Triggers immediate test delivery

### DigestPreview
- Grouped by lane with counts
- Shows actual unread notifications
- "Send me a test" button → triggers edge function

## Data Flow

```
Mock: Fetches from mock adapter, console logs test send
DB: 
  1. Cron job triggers notification-digest function
  2. Function fetches unread per user
  3. Renders email template
  4. Sends via Resend
```

## Edge Function (Stub)

```typescript
// functions/notification-digest/index.ts
export async function sendDigest(userId: string) {
  const prefs = await getPrefs(userId);
  if (prefs.digest_frequency === 'off') return;
  
  const groups = await getUnreadGrouped(userId);
  const html = renderDigestTemplate(groups);
  
  await sendEmail({
    to: user.email,
    subject: 'Your Daily Digest',
    html,
  });
}
```

## Cron Schedule

```sql
-- Daily at 8 AM
SELECT cron.schedule(
  'notification-digest-daily',
  '0 8 * * *',
  $$SELECT net.http_post(...)$$
);
```

## Accessibility

- Preview modal uses focus trap
- Groups are semantic lists (`<ul>`)
- Send button has loading state

## Testing

See: `tests/e2e/notifications.digest.spec.ts`

## Rollout

1. Deploy with `notification_digest=true` (mock preview only)
2. Add edge function + cron migration
3. Flip to DB mode
4. Monitor open rates + click-through
