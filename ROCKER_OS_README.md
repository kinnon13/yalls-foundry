# Rocker OS - Living Platform Architecture

**Date:** 2025-10-15  
**Status:** ✅ Core Architecture Implemented | ⏳ Feature Wiring In Progress

---

## What Is Rocker OS?

Rocker OS is the **central nervous system** of Y'alls.ai. It's not just a chatbot—it's the interface layer that connects every feature, learns from every action, and proactively guides users.

**Key Concept:** Every user action flows through Rocker. Every feature speaks Rocker's language.

---

## Architecture Components

### 1. Event Bus (`src/lib/ai/rocker/bus.ts`)
- Central pub/sub system
- Handles all `rocker_event` → `rocker_action` flows
- Logs to `admin_audit_log` for audit trail
- Triggers Rocker AI processing via `rocker-chat` function

### 2. Feature Integrations (`src/lib/ai/rocker/integrations/`)
Pre-built integrations for each feature domain:

- **`profiles.ts`** - Profile CRUD with Rocker awareness
- **`marketplace.ts`** - Listings, views, purchases
- **`uploads.ts`** - Media analysis and tagging
- **`events.ts`** - Event creation and registration
- **`posts.ts`** - Social actions (save, reshare, create)
- **`mlm.ts`** - Referral tracking and payouts

### 3. Rocker SDK (`src/lib/ai/rocker/sdk.ts`)
Unified API for developers:

```typescript
import { rocker } from '@/lib/ai/rocker/sdk';

// Log any event
await rocker.logEvent('user.create.post', userId, { postId, kind });

// Subscribe to suggestions
const unsubscribe = rocker.onSuggestion('suggest.tag', (action) => {
  showTagSuggestions(action.payload.tags);
});

// Ask Rocker directly
const { response, actions } = await rocker.ask(userId, 'Should I add more photos?');
```

### 4. UI Components
- **`RockerSuggestions.tsx`** - Floating suggestion cards
- **`RockerChat.tsx`** - Conversational interface
- **`useRockerActions.tsx`** - React hook for action subscription

### 5. Memory Tables (Supabase)
- `ai_user_memory` - Personal history
- `ai_global_knowledge` - Shared insights
- `ai_triggers` - Real-time reactions
- `ai_proposals` - Change suggestions
- `admin_audit_log` - Complete audit trail

---

## How It Works

### Example Flow: User Uploads Photo

```
1. User selects photo in MediaUploadDialog
2. Component calls uploadMedia()
3. After upload: rockerMediaUploaded() emits event
4. Event bus logs to admin_audit_log
5. Event bus calls rocker-chat function
6. Rocker AI analyzes image
7. Rocker emits rocker_action: "suggest.tag"
8. UI component (via useRockerActions) shows tag suggestions
9. User accepts tags → logged back to Rocker memory
```

Every feature follows this pattern.

---

## Integration Checklist

| Feature | Integration File | Wired | Tested |
|---------|-----------------|-------|--------|
| Profiles | `integrations/profiles.ts` | ✅ | ⏳ |
| Marketplace | `integrations/marketplace.ts` | ✅ | ⏳ |
| Uploads | `integrations/uploads.ts` | ✅ | ⏳ |
| Events | `integrations/events.ts` | ✅ | ⏳ |
| Posts | `integrations/posts.ts` | ✅ | ⏳ |
| MLM | `integrations/mlm.ts` | ✅ | ⏳ |
| Messages | - | ⏳ | ⏳ |
| CRM | - | ⏳ | ⏳ |
| Admin Tools | - | ⏳ | ⏳ |
| Notifications | - | ⏳ | ⏳ |

---

## Developer Quick Start

### 1. Import the SDK

```typescript
import { rocker } from '@/lib/ai/rocker/sdk';
```

### 2. Log Events in Your Feature

```typescript
// After any user action
await rocker.logEvent('user.create.profile', currentUser.id, {
  profileId: newProfile.id,
  entityType: 'horse',
  name: newProfile.name,
});
```

### 3. Subscribe to Actions in UI

```typescript
import { useRockerActions } from '@/hooks/useRockerActions';

function MyComponent() {
  const { suggestions } = useRockerActions();
  
  // suggestions array will auto-update when Rocker has ideas
  return <SuggestionCards items={suggestions} />;
}
```

### 4. Use Pre-Built Integrations

```typescript
import { createProfileWithRocker } from '@/lib/ai/rocker/integrations';

// Instead of direct DB calls
const { profileId } = await createProfileWithRocker({
  userId: currentUser.id,
  name: 'Fight a Good Fight',
  entityType: 'horse',
});
```

---

## Guardrails & Security

### 1. Consent Required
All Rocker proactive features require user consent via `ai_user_consent` table.

### 2. Audit Trail
Every Rocker event and action is logged to `admin_audit_log`.

### 3. Permission Checks
Rocker Guard middleware validates permissions before any data access.

### 4. Super-Admin Override
Admins can inspect, pause, or correct Rocker actions in Control Room.

---

## Testing

### Manual Testing
1. Open Control Room → Rocker tab
2. Perform action in app (e.g., upload photo)
3. Check `admin_audit_log` for event
4. Verify suggestions appear in UI

### Automated Testing
```typescript
// Unit test example
import { rockerBus } from '@/lib/ai/rocker/bus';

test('emits profile creation event', async () => {
  const events: any[] = [];
  rockerBus.on('user.create.profile', (e) => events.push(e));
  
  await rocker.logEvent('user.create.profile', 'user-123', {
    profileId: 'prof-456',
  });
  
  expect(events).toHaveLength(1);
  expect(events[0].payload.profileId).toBe('prof-456');
});
```

---

## Next Steps

1. ✅ **Architecture Complete** - Bus, integrations, SDK, UI components
2. ⏳ **Wire Remaining Features** - Messages, CRM, Admin, Notifications
3. ⏳ **Update rocker-chat Function** - Handle all event types
4. ⏳ **Add UI Handlers** - Display action-specific components
5. ⏳ **Write Tests** - Unit + integration + E2E
6. ⏳ **Deploy & Monitor** - Track event volumes in production

---

## Support

For questions or issues:
- Review `ROCKER_INTEGRATION_SPEC.md` for detailed specs
- Check Control Room → Code tab for implementation examples
- Review audit logs for debugging event flows

---

**Rocker OS = Y'alls.ai's Operating System** 🚀
