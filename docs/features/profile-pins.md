# Profile Pins

**Status:** ✅ Wired (Production Ready)  
**Version:** 2.0.0  
**Owner:** Profile Team  
**Last Updated:** 2025-01-18

## Overview

Profile Pins allow users to showcase up to 8 key achievements, posts, events, or links at the top of their profile. Pins are fully drag-and-drop with keyboard fallback navigation.

## Key Features

- **8 Pin Limit:** Users can pin up to 8 items
- **6 Pin Types:** post, event, horse, earning, link, achievement
- **Drag & Drop:** Visual reordering with mouse/touch
- **Keyboard Nav:** Arrow keys + Space for accessibility
- **Optimistic Updates:** Instant UI feedback
- **Persistence:** LocalStorage (mock) or Supabase (production)

## User Flow

1. Navigate to profile
2. Click "Add Pin" button
3. Select pin type from dropdown
4. Search/select item to pin
5. Pin appears in grid
6. Drag to reorder or use keyboard arrows
7. Click "Remove" to unpin

## Technical Architecture

### Data Model

```typescript
interface ProfilePin {
  id: string;              // UUID
  user_id: string;         // Owner
  pin_type: PinType;       // post|event|horse|earning|link|achievement
  ref_id: string;          // ID of pinned item
  position: number;        // 1-8
  title?: string;          // Optional display title
  metadata?: object;       // Flexible additional data
  created_at: string;      // ISO timestamp
}
```

### Database Schema

```sql
CREATE TABLE profile_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_type text NOT NULL CHECK (pin_type IN ('post','event','horse','earning','link','achievement')),
  ref_id uuid NOT NULL,
  position int NOT NULL CHECK (position BETWEEN 1 AND 8),
  title text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pins_user_pos ON profile_pins (user_id, position);
```

### RLS Policies

```sql
-- Users can only manage their own pins
CREATE POLICY pin_owner_rw ON profile_pins
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());
```

### RPCs

#### `profile_pins_get(p_user_id uuid)`
Returns all pins for a user, ordered by position.

#### `profile_pins_set(p_pins jsonb)`
Replaces all pins for auth.uid() with new set (max 8).

## Components

### PinBoard
**Location:** `src/components/profile/pins/PinBoard.tsx`  
**Props:** `{ userId: string }`  
**Responsibilities:**
- Fetches pins via useProfilePins hook
- Renders pin grid
- Handles drag-and-drop with react-dnd or dnd-kit
- Keyboard navigation (Arrow keys + Space)
- Empty state when no pins

### PinCard
**Location:** `src/components/profile/pins/PinCard.tsx`  
**Props:** `{ pin: ProfilePin, onRemove: () => void }`  
**Responsibilities:**
- Renders individual pin
- Displays type-specific icon
- Remove button
- Drag handle

### AddPinModal
**Location:** `src/components/profile/pins/AddPinModal.tsx`  
**Props:** `{ userId: string, onAdd: (pin) => void }`  
**Responsibilities:**
- Type selector dropdown
- Search/filter available items
- Preview before adding
- Submit to create pin

## Accessibility

- **ARIA Labels:** All buttons have descriptive labels
- **Keyboard Nav:** Tab, Arrow keys, Space, Enter
- **Focus Management:** Visual focus indicators
- **Screen Reader:** Proper role attributes (list, listitem)
- **WCAG AA:** Contrast ratios meet 4.5:1

### Keyboard Controls

| Key | Action |
|-----|--------|
| Tab | Move between pins |
| Arrow Left/Right | Reorder pins |
| Space | Toggle drag mode |
| Enter | Activate pin action |
| Delete | Remove focused pin |

## Performance

- **Initial Load:** < 100ms (mock), < 200ms (DB)
- **Reorder:** Optimistic update < 50ms
- **Add Pin:** < 150ms with modal animation
- **LocalStorage Cap:** 200 pins max per user

## Testing

### E2E Tests
**Location:** `tests/e2e/profile.pins.spec.ts`

- ✅ Renders empty state
- ✅ Can add first pin
- ✅ Enforces 8 pin limit
- ✅ Keyboard navigation works
- ✅ Can remove pins
- ✅ Drag reorder updates position

### Unit Tests
**Location:** `src/hooks/__tests__/useProfilePins.test.ts`

- ✅ Hook fetches pins correctly
- ✅ Add mutation optimistic update
- ✅ Remove mutation invalidates cache
- ✅ Reorder mutation preserves order

## Monitoring

### Key Metrics
- **Pin Creation Rate:** # pins added per day
- **Reorder Frequency:** # drag events per session
- **Empty State CTR:** % users who add first pin
- **Pin Removal Rate:** % pins removed vs added

### Error Tracking
- Sentry captures RPC failures
- LocalStorage overflow logged
- Drag library errors surfaced

## Rollout Plan

1. **5% Mock Mode:** Week 1, validate UI/UX
2. **10% DB Mode:** Week 2, monitor latency
3. **50% DB Mode:** Week 3, full load test
4. **100% DB Mode:** Week 4, GA

## Known Limitations

- No nested pins (can't pin a pinned item)
- Mobile drag-and-drop requires touch polyfill
- Keyboard reorder animation less smooth than mouse

## Future Enhancements

- Pin collections (group pins into themes)
- Share pin board as link
- Pin templates (pre-filled sets)
- Analytics on which pin types get most clicks

## Support

**Questions?** `#profile-team` on Slack  
**Bugs?** File in Jira under `PROF-*`  
**Runbook:** `docs/runbooks/profile-pins-debug.md`
