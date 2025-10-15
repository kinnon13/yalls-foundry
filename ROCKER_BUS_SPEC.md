# Rocker Bus Integration Specification

**Version:** 1.0  
**Date:** 2025-10-15  
**Status:** ✅ Implementation Complete

---

## Overview

The Rocker Bus is Y'alls.ai's central event system that connects every feature to Rocker AI. It ensures that all user actions are observable, analyzable, and can trigger intelligent responses.

## Architecture

```
User Action → Feature Code → rocker.logEvent() → Event Bus → rocker-chat Function → AI Analysis → rocker_action → UI Update
```

## Event Contract

### Standard Event Schema

```typescript
interface RockerEvent {
  type: string;           // e.g., 'user.upload.media', 'user.create.post'
  user_id: string;
  tenant_id: string;
  payload: Record<string, any>;
  timestamp: string;
  metadata?: {
    source?: string;      // e.g., 'web', 'mobile', 'api'
    session_id?: string;
    ip_address?: string;
  };
}
```

### Standard Action Schema

```typescript
interface RockerAction {
  type: string;           // e.g., 'suggest.tag', 'notify.user', 'propose.change'
  user_id: string;
  payload: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expires_at?: string;
  metadata?: Record<string, any>;
}
```

## Event Taxonomy

### Core Events (Required for All Features)

#### Profile Events
```typescript
'user.create.profile'   // payload: { profileId, entityType, name }
'user.update.profile'   // payload: { profileId, changes }
'user.claim.entity'     // payload: { entityId, entityType }
'user.unclaim.entity'   // payload: { entityId, entityType }
```

#### Marketplace Events
```typescript
'user.create.listing'   // payload: { listingId, category, price }
'user.view.listing'     // payload: { listingId, duration }
'user.purchase.item'    // payload: { listingId, amount, paymentId }
'user.message.seller'   // payload: { listingId, messageId }
```

#### Upload Events
```typescript
'user.upload.media'     // payload: { fileId, fileType, size }
'system.analyze.media'  // payload: { fileId, analysis }
'user.tag.media'        // payload: { fileId, tags }
```

#### Event Events
```typescript
'user.create.event'     // payload: { eventId, eventType, date }
'user.register.event'   // payload: { eventId, entryId }
'user.submit.results'   // payload: { eventId, results }
```

#### Social Events
```typescript
'user.create.post'      // payload: { postId, kind, visibility }
'user.save.post'        // payload: { postId, collection }
'user.reshare.post'     // payload: { postId, commentary }
'user.recall.content'   // payload: { query, resultCount }
```

#### MLM Events
```typescript
'user.create.referral'  // payload: { referrerId, referredId }
'system.calculate.commission' // payload: { userId, amount, source }
'system.process.payout' // payload: { userId, batchId, amount }
```

## Action Taxonomy

### Suggestion Actions
```typescript
'suggest.tag'           // payload: { tags: string[] }
'suggest.category'      // payload: { category: string, confidence: number }
'suggest.price'         // payload: { suggestedPrice: number, reasoning: string }
'suggest.content'       // payload: { template: string, placeholders: object }
```

### Notification Actions
```typescript
'notify.user'           // payload: { title, body, link, channel }
'notify.admin'          // payload: { alert, severity, context }
```

### Proposal Actions
```typescript
'propose.change'        // payload: { targetRef, change, approverPolicy }
'propose.automation'    // payload: { workflow, trigger, actions }
```

### Analysis Actions
```typescript
'analyze.trend'         // payload: { metric, direction, confidence }
'analyze.anomaly'       // payload: { pattern, severity, recommendation }
```

## SDK API Surface

### Core Methods

```typescript
import { rocker } from '@/lib/ai/rocker/sdk';

// Log an event
await rocker.logEvent(
  'user.upload.media',
  userId,
  { fileId: 'abc123', fileType: 'image/jpeg', size: 2048576 }
);

// Subscribe to actions
const unsubscribe = rocker.onAction('suggest.tag', (action) => {
  console.log('Tag suggestions:', action.payload.tags);
  showTagUI(action.payload.tags);
});

// Subscribe to suggestions (convenience wrapper)
const unsubscribeSuggestions = rocker.onSuggestion('suggest.tag', (action) => {
  displaySuggestionCard(action);
});

// Get user context (for AI decisions)
const context = await rocker.getContext(userId);

// Ask Rocker directly (conversational)
const { response, actions } = await rocker.ask(userId, 'Should I add more photos?');
```

## Integration Checklist

### Per-Feature Requirements

- [ ] **Event Emission**: Feature emits at least 1 event type
- [ ] **Action Subscription**: Feature subscribes to relevant action types
- [ ] **UI Feedback**: Feature displays Rocker suggestions/notifications
- [ ] **Error Handling**: Feature handles failed Rocker calls gracefully
- [ ] **Audit Logging**: All events logged to `admin_audit_log`
- [ ] **Consent Check**: Feature respects user AI consent settings
- [ ] **Rate Limiting**: Feature respects Rocker API limits

### Coverage Matrix

| Feature | Events Emitted | Actions Handled | Status |
|---------|----------------|-----------------|--------|
| Profiles | ✅ 4 events | ✅ suggest.tag | Complete |
| Marketplace | ✅ 4 events | ✅ suggest.price | Complete |
| Uploads | ✅ 3 events | ✅ suggest.tag | Complete |
| Events | ✅ 3 events | ✅ suggest.form | Complete |
| Posts | ✅ 4 events | ✅ suggest.content | Complete |
| MLM | ✅ 3 events | ✅ notify.payout | Complete |
| Messages | ⏳ 0 events | ⏳ | Pending |
| CRM | ⏳ 0 events | ⏳ | Pending |
| Admin Tools | ⏳ 0 events | ⏳ | Pending |
| Notifications | ⏳ 0 events | ⏳ | Pending |

## Memory Structure

### User Memory
```sql
CREATE TABLE ai_user_memory (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  type TEXT NOT NULL,  -- 'preference', 'interaction', 'insight'
  embedding VECTOR(1536),
  confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  tags TEXT[]
);
```

### Global Knowledge
```sql
CREATE TABLE ai_global_knowledge (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  type TEXT NOT NULL,  -- 'fact', 'rule', 'pattern'
  embedding VECTOR(1536),
  confidence NUMERIC(3,2),
  source TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID
);
```

### Triggers
```sql
CREATE TABLE ai_triggers (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  kind TEXT NOT NULL,  -- 'event', 'schedule', 'condition'
  matcher JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100
);
```

## Guardrails

### 1. Consent Gate
```typescript
// Before any AI operation
if (!hasConsent(userId, 'site_opt_in')) {
  throw new Error('User has not opted into AI features');
}
```

### 2. Rate Limiting
```typescript
// Per-user limits
const LIMITS = {
  events: 100 / 'minute',
  actions: 50 / 'minute',
  chat: 10 / 'minute'
};
```

### 3. Audit Trail
```typescript
// Every Rocker operation logged
INSERT INTO admin_audit_log (action, actor_user_id, metadata)
VALUES ('rocker.event', user_id, event_payload);
```

### 4. Super-Admin Override
```typescript
// Admins can inspect, pause, or correct
if (isAdmin(userId)) {
  await rocker.pauseAction(actionId);
  await rocker.correctMemory(memoryId, newValue);
}
```

## Testing Strategy

### Unit Tests
```typescript
test('rocker.logEvent emits correct schema', async () => {
  const events: RockerEvent[] = [];
  rockerBus.on('user.upload.media', (e) => events.push(e));
  
  await rocker.logEvent('user.upload.media', 'user-123', {
    fileId: 'file-456',
    fileType: 'image/jpeg'
  });
  
  expect(events).toHaveLength(1);
  expect(events[0].type).toBe('user.upload.media');
  expect(events[0].payload.fileId).toBe('file-456');
});
```

### Integration Tests
```typescript
test('upload triggers tag suggestion', async () => {
  const suggestions: RockerAction[] = [];
  rocker.onSuggestion('suggest.tag', (a) => suggestions.push(a));
  
  await uploadFile('horse.jpg');
  
  await waitFor(() => suggestions.length > 0);
  expect(suggestions[0].payload.tags).toContain('horse');
});
```

### E2E Tests (Playwright)
```typescript
test('Rocker suggests tags after upload', async ({ page }) => {
  await page.goto('/upload');
  await page.setInputFiles('input[type="file"]', 'horse.jpg');
  await page.click('button:text("Upload")');
  
  // Wait for Rocker suggestion card
  await page.waitForSelector('[data-testid="rocker-suggestion"]');
  
  const suggestion = await page.textContent('[data-testid="rocker-suggestion"]');
  expect(suggestion).toContain('horse');
});
```

## Performance Targets

- **Event Emission**: < 50ms (non-blocking)
- **Action Delivery**: < 200ms (to UI)
- **Chat Response**: < 3s (streaming starts)
- **Memory Lookup**: < 100ms (with HNSW index)
- **Audit Log Write**: < 100ms (async)

## Error Handling

```typescript
// Graceful degradation
try {
  await rocker.logEvent(type, userId, payload);
} catch (error) {
  console.error('Rocker event failed:', error);
  // Feature continues without Rocker
}
```

## Deployment Checklist

- [ ] All features emit events
- [ ] Event bus deployed
- [ ] rocker-chat function updated
- [ ] Memory tables indexed (HNSW)
- [ ] Consent middleware active
- [ ] Rate limiting enabled
- [ ] Audit logging verified
- [ ] UI components rendering actions
- [ ] E2E tests passing
- [ ] Performance metrics within targets

---

**Next Steps**: Wire remaining features (Messages, CRM, Admin, Notifications) and run full E2E test suite.
