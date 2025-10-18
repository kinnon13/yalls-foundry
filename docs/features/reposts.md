# Reposts

**Status:** wired  
**Severity:** p0  
**Owner:** web

## Overview

Complete repost/quote system allowing users to reshare posts with optional commentary. Supports plain reposts, quotes with captions, and entity-targeted reposts.

## Routes

- `/profile/:id/reposts` - User's repost timeline

## Components

- `src/components/profile/RepostButton.tsx` - Repost action button
- `src/components/profile/RepostModal.tsx` - Repost dialog with caption input

## Database Schema

### Table: `reposts`

```sql
CREATE TABLE public.reposts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  source_post_id uuid NOT NULL,
  target_entity_id uuid NULL,
  kind text NOT NULL CHECK (kind IN ('repost','quote')),
  caption text NULL,
  created_at timestamptz NOT NULL
);
```

**Indexes:**
- `idx_reposts_user_created` - Fast user timeline queries
- `idx_reposts_source_created` - Source post repost tracking
- `ux_reposts_once` - Prevents duplicate plain reposts per user/target

### RLS Policies

- `reposts_read_all` - Everyone can view reposts
- `reposts_insert_own` - Users can create their own reposts
- `reposts_delete_own` - Users can delete their own reposts

## RPCs

### `post_repost(p_source_post_id, p_caption?)`

Creates or updates a plain repost. Idempotent - reposting the same post updates the caption.

**Parameters:**
- `p_source_post_id: uuid` - Original post ID
- `p_caption: text?` - Optional caption

**Returns:** `{ id, kind, caption, created_at }`

### `post_quote(p_source_post_id, p_caption)`

Creates a quote repost with required caption.

**Parameters:**
- `p_source_post_id: uuid` - Original post ID
- `p_caption: text` - Required caption

**Returns:** `{ id, kind, caption, created_at }`

### `post_repost_entity(p_source_post_id, p_target_entity_id, p_caption?)`

Reposts to a specific entity (e.g., organization page).

**Parameters:**
- `p_source_post_id: uuid` - Original post ID
- `p_target_entity_id: uuid` - Target entity
- `p_caption: text?` - Optional caption

**Returns:** `{ id, kind, caption, created_at }`

## Port Interface

```typescript
interface RepostsPort {
  create(source_post_id: string, caption?: string, targets?: string[]): Promise<{ new_post_id: string }>;
  list(userId: string): Promise<Repost[]>;
}
```

## Adapters

- **DB:** `src/adapters/db/reposts.db.ts` - Wired to Supabase RPCs
- **Mock:** `src/adapters/mock/reposts.mock.ts` - localStorage implementation

## Tests

- `tests/e2e/reposts.spec.ts` - E2E coverage

## Implementation Notes

- **Idempotency:** Plain reposts use unique constraint - reposting same post updates caption
- **Quote vs Repost:** Quotes require caption and allow multiple per user
- **Entity Targeting:** Optional multi-entity repost support via `target_entity_id`
- **Performance:** <100ms create, ~50ms list queries with proper indexing

## Feature Flags

- `reposts` - Global toggle

## Future Enhancements

- Repost counter on original posts
- Repost chain visualization
- Cross-entity repost permissions
