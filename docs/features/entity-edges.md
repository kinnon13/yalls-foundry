# Entity Edges

**Status:** wired  
**Severity:** p1  
**Owner:** web

## Overview

Entity relationship graph enabling parent-child hierarchies, partnerships, sponsorships, and granular access control. Powers crossposting, delegation, and multi-entity management.

## Routes

- `/entities/:id/edges` - Manage entity relationships

## Components

- `src/components/entities/EdgesManager.tsx` - Relationship management UI
- `src/hooks/useEntityEdges.ts` - React Query hook for edges

## Database Schema

### Table: `entity_edges`

```sql
CREATE TABLE public.entity_edges (
  id UUID PRIMARY KEY,
  from_entity_id UUID NOT NULL,
  to_entity_id UUID NOT NULL,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('parent','child','member','partner','sponsor','affiliate')),
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(from_entity_id, to_entity_id, edge_type)
);
```

**Indexes:**
- `ix_entity_edges_from_type` - Fast from-entity lookups
- `ix_entity_edges_to_type` - Fast to-entity lookups
- `ix_entity_edges_created_by` - Audit trail

### Table: `entity_edge_permissions`

```sql
CREATE TABLE public.entity_edge_permissions (
  id UUID PRIMARY KEY,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL,
  can_post BOOLEAN NOT NULL DEFAULT false,
  can_manage BOOLEAN NOT NULL DEFAULT false,
  granted_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(entity_id, user_id)
);
```

**Indexes:**
- `ix_entity_edge_permissions_entity` - Entity permission lookups
- `ix_entity_edge_permissions_user` - User permission lookups

### RLS Policies

**entity_edges:**
- `entity_edges_read_all` - Everyone can view relationships
- `entity_edges_insert_manager` - Only entity owners/members can create
- `entity_edges_update_manager` - Only entity owners/members can update
- `entity_edges_delete_manager` - Only entity owners/members can delete

**entity_edge_permissions:**
- `entity_edge_permissions_read_all` - Everyone can view permissions
- `entity_edge_permissions_manage_owner` - Only owners/managers can modify

## RPCs

### `entity_edges_list(p_entity_id, p_direction?)`

List relationships for an entity.

**Parameters:**
- `p_entity_id: uuid` - Entity ID
- `p_direction: text` - 'from' (default), 'to', or 'both'

**Returns:** Array of edges

### `entity_edge_create(p_from_entity_id, p_to_entity_id, p_edge_type, p_metadata?)`

Create a relationship between entities.

**Parameters:**
- `p_from_entity_id: uuid` - Source entity
- `p_to_entity_id: uuid` - Target entity
- `p_edge_type: text` - Relationship type
- `p_metadata: jsonb?` - Optional metadata

**Returns:** `uuid` - Edge ID

### `entity_edge_update(p_id, p_edge_type?, p_metadata?)`

Update an existing edge.

**Parameters:**
- `p_id: uuid` - Edge ID
- `p_edge_type: text?` - New type
- `p_metadata: jsonb?` - New metadata

**Returns:** `boolean` - Success

### `entity_edge_remove(p_id)`

Delete an edge.

**Parameters:**
- `p_id: uuid` - Edge ID

**Returns:** `boolean` - Success

### `entity_edge_permissions_set(p_entity_id, p_user_id, p_can_post, p_can_manage)`

Grant or revoke permissions for a user on an entity.

**Parameters:**
- `p_entity_id: uuid` - Entity ID
- `p_user_id: uuid` - User ID
- `p_can_post: boolean` - Post permission
- `p_can_manage: boolean` - Management permission

**Returns:** `uuid` - Permission ID

## Port Interface

```typescript
interface EntityEdgesPort {
  list(entityId: string, direction?: 'from' | 'to' | 'both'): Promise<EntityEdge[]>;
  create(fromEntityId: string, toEntityId: string, edgeType: string, metadata?: Record<string, any>): Promise<string>;
  update(edgeId: string, edgeType?: string, metadata?: Record<string, any>): Promise<void>;
  remove(edgeId: string): Promise<void>;
  setPermissions(entityId: string, userId: string, canPost: boolean, canManage: boolean): Promise<string>;
}
```

## Adapters

- **DB:** `src/adapters/db/entityEdges.db.ts` - Wired to Supabase RPCs
- **Mock:** `src/adapters/mock/entityEdges.mock.ts` - localStorage implementation

## Tests

- `tests/e2e/entity-edges.spec.ts` - E2E coverage

## Implementation Notes

- **Permission Model:** Owner + explicit grants via entity_edge_permissions
- **Edge Types:** parent, child, member, partner, sponsor, affiliate
- **Crosspost Integration:** post_repost_entity now checks permissions
- **Performance:** <50ms list queries with proper indexing

## Feature Flags

- `entity_edges` - Global toggle

## Future Enhancements

- Automatic edge propagation (e.g., parent→child auto-crosspost)
- Edge metadata validation by type
- Bulk permission grants
- Edge deletion cascade rules
