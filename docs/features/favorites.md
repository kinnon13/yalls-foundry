# Favorites System

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Owner:** Social Team

## Overview

Favorites allow users to bookmark posts, events, entities, and horses for quick access. Toggling is instant with optimistic updates and works across mock and DB adapters.

## Key Features

- **5 Favorite Types:** post, event, entity, horse, listing
- **Instant Toggle:** < 100ms perceived latency
- **Optimistic Updates:** UI updates before server confirms
- **Grouped View:** Favorites tab groups by type
- **Unlimited Favorites:** (capped at 200 per type in mock mode)

## User Flow

1. User sees heart icon on any favoritable item
2. Click heart to favorite
3. Icon fills instantly (optimistic)
4. Heart persists across sessions
5. View all favorites in profile tab

## Technical Architecture

### Data Model

```typescript
interface Favorite {
  id: string;              // UUID
  user_id: string;         // Owner
  fav_type: FavoriteType;  // post|event|entity|horse|listing
  ref_id: string;          // ID of favorited item
  created_at: string;      // ISO timestamp
}

type FavoriteType = 'post' | 'event' | 'entity' | 'horse' | 'listing';
```

### Database Schema

```sql
CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fav_type text NOT NULL CHECK (fav_type IN ('post','event','entity','horse','listing')),
  ref_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, fav_type, ref_id)
);

CREATE INDEX idx_favs_user ON favorites (user_id, created_at DESC);
```

### RLS Policies

```sql
CREATE POLICY favorites_owner_rw ON favorites
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());
```

### RPCs

#### `favorite_toggle(p_fav_type text, p_ref_id uuid)`
Toggles favorite status. Returns `{ is_favorited: boolean }`.

#### `favorites_list(p_user_id uuid, p_fav_type text DEFAULT NULL)`
Returns all favorites, optionally filtered by type.

## Components

### FavoriteButton
**Location:** `src/components/common/FavoriteButton.tsx`  
**Props:** 
```typescript
{
  type: FavoriteType;
  refId: string;
  userId: string;
  className?: string;
}
```

**Responsibilities:**
- Renders heart icon (filled or outline)
- Handles click to toggle
- Optimistic state update
- Accessible (aria-pressed, aria-label)
- Haptic feedback (if available)

### FavoritesTab
**Location:** `src/routes/profile/[id]/favorites.tsx`  
**Responsibilities:**
- Fetches all favorites for user
- Groups by type (tabs)
- Infinite scroll (future)
- Empty state per type

## Accessibility

- **ARIA:** `role="button"`, `aria-pressed`, `aria-label="Favorite [item]"`
- **Keyboard:** Enter/Space to toggle
- **Focus:** Visible outline on focus
- **Screen Reader:** Announces "Favorited" / "Unfavorited"

## Performance

- **Toggle Latency:** < 100ms perceived (optimistic)
- **Server Round-Trip:** < 250ms (DB mode)
- **Favorites Tab Load:** < 200ms for 50 items
- **LocalStorage Cap:** 200 favorites per type (mock mode)

## Testing

### E2E Tests
**Location:** `tests/e2e/favorites.spec.ts`

- ✅ Can toggle favorite on post
- ✅ State persists across refresh
- ✅ Optimistic update < 100ms
- ✅ Favorites appear in tab
- ✅ Keyboard toggle works

### Unit Tests
**Location:** `src/hooks/__tests__/useFavorite.test.ts`

- ✅ Toggle mutation optimistic
- ✅ Retry: 0 prevents double-taps
- ✅ Query invalidation on success

## Monitoring

### Key Metrics
- **Favorite Rate:** # favorites per DAU
- **Toggle Latency:** p95 < 100ms
- **Unfavorite Rate:** % unfavorites vs favorites
- **Favorites Tab Views:** % users who view tab

### Error Tracking
- Sentry captures RPC failures
- Rate limit errors logged (5/sec)

## Rate Limiting

- **5 toggles per second** per user
- Enforced client-side (debounce)
- Server-side validation (future)

## Known Issues

- Double-tap on mobile can create race condition (mitigated by retry: 0)
- LocalStorage overflow on devices with 200+ favorites (graceful degradation)

## Future Enhancements

- Favorite collections (group favorites)
- Shared favorite lists
- Favorite notifications (when favorited item updates)
- Favorite analytics (which items get most favorites)

## Support

**Questions?** `#social-team` on Slack  
**Bugs?** File in Jira under `SOC-*`  
**Runbook:** `docs/runbooks/favorites-debug.md`
