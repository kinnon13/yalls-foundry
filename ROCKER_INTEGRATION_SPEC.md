# Rocker Integration Specification

**Status:** Architecture Defined | **Date:** 2025-10-15  
**Goal:** Make Rocker the central interface layer (OS) for Y'alls.ai

---

## Core Principle

> **Rocker isn't a feature — it's the operating system for Y'alls.ai.**
> Every module must speak through it, every action must log to it, and every user experience must flow from it.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                            │
│  (React Components - listen to rockerBus.onAction)         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                      Rocker Event Bus                       │
│  • Receives: rocker_event from all features                │
│  • Processes: via Rocker AI (rocker-chat function)         │
│  • Emits: rocker_action back to UI                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                    Feature Integrations                     │
│  • Profiles      • Marketplace    • Uploads                │
│  • Events        • Posts          • MLM/Referrals          │
│  • Messages      • CRM            • Admin Tools            │
└─────────────────────────────────────────────────────────────┘
```

---

## Event Types

### User Events
- `user.upload.media` - User uploads photo/video
- `user.create.profile` - User creates profile
- `user.update.profile` - User edits profile
- `user.claim.profile` - User claims unclaimed profile
- `user.view.profile` - User views profile
- `user.create.post` - User creates post
- `user.save.post` - User saves post
- `user.reshare.post` - User reshares post
- `user.create.event` - User creates event
- `user.register.event` - User registers for event
- `user.create.listing` - User creates marketplace listing
- `user.view.listing` - User views listing
- `user.purchase.listing` - User completes purchase
- `user.message.send` - User sends message
- `user.search` - User performs search

### System Events
- `system.consent.granted` - User grants AI consent
- `system.error` - System error occurred

### Business Events
- `business.create` - Business profile created
- `business.lead.created` - New CRM lead

### MLM Events
- `mlm.referral.created` - New referral
- `mlm.payout.triggered` - Payout initiated

---

## Action Types (Rocker Responses)

- `suggest.tag` - Suggest tags for content
- `suggest.link` - Suggest profile connections
- `suggest.follow` - Suggest profiles to follow
- `suggest.listing` - Recommend marketplace item
- `suggest.event` - Recommend event
- `notify.user` - Send notification
- `update.memory` - Update user memory
- `create.proposal` - Create change proposal
- `verify.data` - Request data verification
- `analyze.media` - Analyze uploaded media
- `optimize.search` - Improve search results

---

## Integration Guide

### Step 1: Import Rocker Integration

```typescript
import { 
  rockerProfileCreated,
  rockerProfileUpdated,
  createProfileWithRocker,
} from '@/lib/ai/rocker/integrations';
```

### Step 2: Replace Direct DB Calls

**Before (Direct):**
```typescript
const { data } = await supabase
  .from('entity_profiles')
  .insert({ owner_id, name, ... });
```

**After (Rocker-Aware):**
```typescript
const { profileId } = await createProfileWithRocker({
  userId: owner_id,
  name,
  entityType: 'horse',
  sessionId: rockerSessionId,
});
```

### Step 3: Log User Actions

```typescript
// After any user action
await rockerProfileViewed({
  userId: currentUser.id,
  profileId: profile.id,
  entityType: profile.entity_type,
  sessionId: rockerSessionId,
});
```

### Step 4: Subscribe to Rocker Actions (UI)

```typescript
import { rockerBus } from '@/lib/ai/rocker/bus';

useEffect(() => {
  const unsubscribe = rockerBus.onAction((action) => {
    if (action.type === 'suggest.tag') {
      // Show tag suggestions in UI
      setTagSuggestions(action.payload.tags);
    }
  });
  return unsubscribe;
}, []);
```

---

## Feature Integration Checklist

| Feature | Event Emitters | Rocker Actions | Status |
|---------|---------------|----------------|---------|
| **Profiles** | ✅ create, update, claim, view | suggest.link, verify.data | ✅ Wired |
| **Marketplace** | ✅ create, view, purchase | suggest.listing, optimize.search | ✅ Wired |
| **Uploads** | ✅ media upload | analyze.media, suggest.tag | ✅ Wired |
| **Events** | ✅ create, register | suggest.event, verify.data | ✅ Wired |
| **Posts** | ✅ create, save, reshare | update.memory | ✅ Wired |
| **MLM** | ✅ referral, payout | notify.user | ✅ Wired |
| **Messages** | ⏳ send, receive | suggest.response | ⏳ TODO |
| **CRM** | ⏳ lead created | suggest.followup | ⏳ TODO |
| **Admin** | ⏳ flag content | create.proposal | ⏳ TODO |
| **Notifications** | ⏳ N/A | notify.user | ⏳ TODO |

---

## Memory Structure

All Rocker context stored in unified schema:

```
ai_user_memory        → Personal history (preferences, actions)
ai_global_knowledge   → Shared insights (best practices, patterns)
ai_feature_context    → State of each feature (incomplete profiles, pending actions)
ai_triggers           → Real-time event reactions (rules engine)
ai_change_proposals   → Suggested improvements (user-approved changes)
```

---

## Guardrails

### 1. Rocker Guard Middleware
- Checks permissions before data access
- Enforces consent requirements
- Validates user identity

### 2. Audit Log
- Every Rocker action logged to `admin_audit_log`
- Tracks event type, user, payload, timestamp

### 3. Super-Admin Override
- Admins can inspect/pause/correct Rocker actions
- View full event stream in Control Room

---

## Testing Strategy

### Unit Tests
- Test event emission: `rockerBus.emit()`
- Test action handling: `rockerBus.onAction()`
- Mock Rocker AI responses

### Integration Tests
- Verify end-to-end flows (event → action → UI)
- Test with real Supabase functions
- Validate memory updates

### E2E Tests (Playwright)
- Simulate user journey with Rocker suggestions
- Verify UI responds to actions
- Check consent boundaries

---

## Next Steps

1. ✅ **Architecture Defined** - Core bus + integrations
2. ⏳ **Wire Remaining Features** - Messages, CRM, Admin, Notifications
3. ⏳ **Update Rocker AI Prompts** - Handle new event types
4. ⏳ **Add UI Action Handlers** - Display suggestions in components
5. ⏳ **Implement Guardrails** - Rocker Guard + audit logging
6. ⏳ **Write Tests** - Unit + integration + E2E
7. ⏳ **Deploy** - Test in staging → production

---

## Developer Notes

- **Single SDK:** Always use `@/lib/ai/rocker/integrations`
- **Event Everywhere:** Log events for EVERY user action
- **Action-Driven UI:** Build components that react to `rockerBus.onAction()`
- **Session Tracking:** Pass `sessionId` for context continuity
- **Fail Gracefully:** Bus errors shouldn't break features

---

## Example: Full Integration

```typescript
// components/profiles/ProfileCreator.tsx
import { createProfileWithRocker } from '@/lib/ai/rocker/integrations';
import { rockerBus } from '@/lib/ai/rocker/bus';

function ProfileCreator() {
  const [suggestions, setSuggestions] = useState([]);

  // Subscribe to Rocker suggestions
  useEffect(() => {
    const unsub = rockerBus.onAction((action) => {
      if (action.type === 'suggest.tag') {
        setSuggestions(action.payload.tags);
      }
    });
    return unsub;
  }, []);

  const handleCreate = async (data) => {
    // Create with Rocker awareness
    const { profileId } = await createProfileWithRocker({
      userId: currentUser.id,
      name: data.name,
      entityType: 'horse',
      sessionId: rockerSessionId,
    });

    // Rocker automatically suggests tags, links, etc.
    toast.success('Profile created! Rocker has suggestions.');
  };

  return (
    <form onSubmit={handleCreate}>
      {/* Profile form fields */}
      {suggestions.length > 0 && (
        <TagSuggestions tags={suggestions} />
      )}
    </form>
  );
}
```

---

**End of Spec**
