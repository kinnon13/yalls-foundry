# Context-Aware Kernel Architecture

## Overview
Instead of static dashboard modules, the system dynamically spawns **context-aware kernels** based on user relationships, roles, and entity ownership. Kernels appear when relevant and disappear when complete/expired.

## Core Concept

### Traditional (Static)
```
User visits: /dashboard?m=incentives
→ Shows ALL incentives (filtered by permissions)
```

### Context-Aware (Dynamic)
```
User owns Horse A, which is entered in Incentive X
→ Dashboard auto-shows "Incentive X - Horse A" kernel
→ Click opens: /dashboard?f=incentive_entry&ctx=<kernel_id>&entry_id=<entry_id>
```

## Architecture Components

### 1. Kernel Contexts Table
**`kernel_contexts`** tracks what contextual features should appear for each user:

```sql
- user_id: Who sees this kernel
- kernel_type: 'incentive_entry', 'job_assignment', 'farm_updates', etc.
- context_entity_id: The entity this kernel is about (horse, farm, business)
- context_data: Metadata (entry_id, status, deadlines, etc.)
- source: How kernel was created ('entry', 'follow', 'team_member', 'ownership')
- priority: Display order (10=highest, 100=lowest)
- expires_at: When kernel should disappear
```

### 2. Auto-Spawn Triggers

Kernels are created automatically via database triggers:

#### Entry Trigger
```sql
-- When user enters horse in event/incentive
entries INSERT → create kernel_contexts(
  user_id = horse_owner,
  kernel_type = 'incentive_entry',
  context_data = {class_id, entry_id, status}
)
```

#### Follow Trigger
```sql
-- When user follows farm/business
follows INSERT → create kernel_contexts(
  user_id = follower,
  kernel_type = 'entity_updates',
  context_entity_id = followed_entity
)
```

#### Team Assignment Trigger
```sql
-- When user joins business team
business_team INSERT → create kernel_contexts(
  user_id = team_member,
  kernel_type = 'team_workspace',
  context_data = {role, business_name}
)
```

### 3. Frontend Integration

**ContextKernelHost** component queries active kernels and renders them:

```tsx
// In dashboard/overview.tsx
<ContextKernelHost />

// Renders:
┌─────────────────────────────────────────┐
│ Active Items                            │
├─────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐        │
│ │Incentive X  │ │Job: Framing │        │
│ │Horse: Apollo│ │Client: ABC  │        │
│ │Status: Paid │ │Due: Nov 15  │        │
│ │[Open →]     │ │[Open →]     │        │
│ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────┘
```

## Use Cases

### Incentives
**Producer View:**
- Creates incentive → kernel spawns on their dashboard
- Shows entries, nominations, draws

**Owner/Rider View:**
- Enters horse → kernel spawns showing their entry status
- Click opens detailed entry management (pay, nominate, etc.)

### Job Management (Contractor Example)
**General Contractor:**
- Creates job → kernel spawns
- Assigns framer, plumber, electrician
- Each gets kernel with their scope/schedule

**Subcontractor (Plumber):**
- Sees kernel: "Job: House ABC - Plumbing"
- Context data: schedule, materials list, contact info
- Can update progress directly from kernel

### Event Participation
- User RSVPs to event → kernel spawns
- Shows countdown, schedule, location
- Updates when event is modified
- Expires after event ends

### Farm/Entity Following
- User follows Farm Y → kernel spawns
- Shows recent posts/updates from that farm
- Click opens farm profile or feed

## Kernel Types Registry

Define kernel types in `feature-kernel/registry.ts`:

```ts
export const contextKernelTypes = {
  incentive_entry: {
    id: 'incentive_entry',
    title: 'Incentive Entry',
    loader: () => import('../features/incentives/EntryDetail'),
    schema: z.object({
      entry_id: z.string().uuid(),
      class_id: z.string().uuid(),
    }),
    requires: ['incentives'],
  },
  job_assignment: {
    id: 'job_assignment',
    title: 'Job Assignment',
    loader: () => import('../features/jobs/AssignmentDetail'),
    schema: z.object({
      job_id: z.string().uuid(),
      role: z.string(),
    }),
    requires: ['jobs'],
  },
  // ...
};
```

## Entitlement Integration

Kernels respect entitlements via `requires` field:

```tsx
// In FeatureHost
<EntitlementGate featureId={kernelDef.id} requires={kernelDef.requires}>
  <LazyKernelFeature {...contextData} />
</EntitlementGate>
```

**Result:**
- Free user sees kernel card but can't open it (paywall overlay)
- Pro user sees kernel and can interact fully
- Observability logs `kernel_gate` events

## Admin Tools

### Manual Kernel Creation
```sql
-- Admin grants temporary kernel to user
SELECT admin_create_kernel_context(
  '<user_id>',
  'preview_access',
  NULL, -- no entity
  '{"feature": "new_dashboard", "expires": "2025-11-01"}'::jsonb,
  'admin_grant'
);
```

### Cleanup Expired Kernels
```sql
-- Run daily via cron
SELECT cleanup_expired_kernels();
```

### Analytics
```sql
-- Most common kernel types
SELECT kernel_type, COUNT(*) 
FROM kernel_contexts 
WHERE created_at > now() - interval '30 days'
GROUP BY kernel_type 
ORDER BY COUNT(*) DESC;

-- User engagement by kernel
SELECT user_id, COUNT(DISTINCT kernel_type) as kernel_variety
FROM kernel_contexts
GROUP BY user_id
ORDER BY kernel_variety DESC
LIMIT 100;
```

## Migration Path

### Phase 1: Add Context Layer (Now)
1. ✅ Create `kernel_contexts` table
2. ✅ Add auto-spawn triggers for entries, follows, teams
3. ✅ Render `ContextKernelHost` on dashboard overview
4. Add specific kernel feature components as needed

### Phase 2: Kernelize Existing Modules
1. Convert high-value modules (Orders, Events) to kernel features
2. Update registry with context-aware schemas
3. Keep traditional ?m= routes as fallback

### Phase 3: Role-Based Kernel Composition
1. Add role-specific kernel rules (contractor vs. subcontractor)
2. Implement kernel filtering/grouping by role
3. Add kernel notifications/reminders

## Security Notes

- ✅ All kernels protected by RLS (user can only see their own)
- ✅ Feature access gated by entitlements (plan + override + age)
- ✅ Context data validated before kernel creation
- ✅ Idempotent spawning via `context_key` unique constraint
- ✅ Age gating enforced via `age_ok()` function (≥13 years)
- ✅ Admin override via `admin_create_kernel_context()`
- ✅ Audit trail via `ai_action_ledger`

## Performance & Hardening

### De-duplication
- **`context_key`** (generated column): `COALESCE(context_data->>'entry_id', context_entity_id::text)`
- Unique constraint: `(user_id, kernel_type, context_key)`
- Triggers use `ON CONFLICT DO UPDATE` to refresh existing kernels (idempotent)

### Pagination
- Cursor-based pagination via `get_user_kernels(p_limit, p_cursor)`
- Default limit: 24 kernels per page
- `next_cursor` field enables "Load More" without full table scans
- Prevents UI lag for users with 100+ active contexts

### TTL & Hygiene
- `expires_at` column for automatic expiration
- `cleanup_expired_kernels()` function purges expired rows
- Run via cron/scheduler daily
- Keeps table lean (<10k rows per user)

### Observability
- **Standardized events**: `kernel_render`, `kernel_open`, `kernel_spawn`, `kernel_action`
- **Logged to**: `rpc_observations` table
- **Meta keys**: `{ type: kernel_type, source, outcome, surface: 'kernel' }`
- **Metrics**: `kernel_metrics(p_window_minutes)` for p95 latency + error rates

### Smoke Checks
```sql
-- Verify no duplicates
SELECT kernel_type, context_key, COUNT(*)
FROM kernel_contexts
GROUP BY 1,2 HAVING COUNT(*)>1;

-- Check pagination performance
EXPLAIN ANALYZE SELECT * FROM get_user_kernels(auth.uid(), 24, NULL);

-- View telemetry
SELECT rpc_name, COUNT(*), ROUND(AVG(duration_ms)::numeric,2) avg_ms
FROM rpc_observations
WHERE rpc_name IN ('kernel_render','kernel_open','kernel_spawn')
  AND created_at > now()-interval '1 hour'
GROUP BY 1;

-- Backfill existing data
SELECT backfill_kernels();
```

## Kernel Type Registry

**New**: `contextKernelTypes` in `contextUtils.ts` provides type-safe mapping:

```ts
export const contextKernelTypes = {
  incentive_entry: {
    featureId: 'incentives',
    propMap: (ctx) => ({
      program: ctx.class_id,
      horse: ctx.horse_id,
      mode: 'enter' as const,
    }),
  },
  team_workspace: {
    featureId: 'work_packages',
    propMap: (ctx) => ({
      project: ctx.business_id,
      role: ctx.role,
      range: 'week' as const,
    }),
  },
} as const;

// Usage:
openKernel({
  kernelType: 'incentive_entry',
  contextData: { entry_id: '...', class_id: '...', status: 'pending' },
  returnTo: '/dashboard'
})
// Resolves to: ?f=incentives&fx.incentives.program=...&fx.incentives.mode=enter
```

## Indexed Queries
- `(user_id, kernel_type, context_key)` - uniqueness + fast lookups
- `(user_id, priority, created_at)` - paginated sorting
- `(expires_at)` - cleanup performance
- Batch kernel creation in triggers (single INSERT per event)
