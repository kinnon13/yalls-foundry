# Context-Aware Kernel Patterns

This document describes the context-aware kernel architecture that enables relationship-driven feature mounting and scoped access patterns.

## Overview

Context-aware kernels are feature islands that can be mounted dynamically based on user relationships (connections) and opened with specific context props. This enables patterns like:

- **Producer → Incentives**: Open incentives kernel with a specific horse pre-selected
- **GC → Subcontractors**: Share scoped work packages with plumbers/electricians
- **Follows → Auto-mount**: Automatically show kernels for entities the user follows

## Core Concepts

### 1. Connections Table

Tracks relationships between entities:

```sql
create table public.connections (
  subject_type text,  -- 'user'|'entity'|'horse'
  subject_id   uuid,
  relation     text,  -- 'follows'|'owns'|'assigned'
  object_type  text,  -- 'incentive'|'project'|'horse'
  object_id    uuid,
  metadata     jsonb,
  expires_at   timestamptz
);
```

**Examples:**
- User follows an incentive program
- User owns a horse
- User is assigned to a project as plumber
- User is a member of an entity/farm

### 2. Context Props

Features can receive context via URL params:

```
/dashboard?f=incentives&fx.incentives.horse=<uuid>&fx.incentives.mode=nominate
/dashboard?f=work_packages&fx.work_packages.project=<uuid>&fx.work_packages.role=plumber
```

### 3. Auto-Mounting

Kernels automatically appear on the dashboard based on connections:

```typescript
// Get kernels to auto-mount
const kernels = await getUserConnectionKernels();
// Returns: [
//   { kernel_type: 'incentives', object_id: '...', priority: 9 },
//   { kernel_type: 'work_packages', object_id: '...', priority: 5 }
// ]
```

## Implementation Patterns

### Pattern 1: Producer → Incentives

**Use Case**: Horse owner wants to nominate their horse for an incentive program.

**Flow:**
1. User selects horse in Producer tab
2. Click "Nominate for Incentives"
3. Opens incentives kernel with horse context:
   ```typescript
   openFeaturesViaURL({
     features: ['incentives'],
     props: { 
       incentives: { 
         horse: horseId, 
         mode: 'nominate' 
       }
     }
   })
   ```
4. Kernel checks entitlements + eligibility
5. Shows nomination form or paywall

**Registry Entry:**
```typescript
incentives: {
  id: 'incentives',
  schema: z.object({
    horse: z.string().uuid().optional(),
    program: z.string().uuid().optional(),
    mode: z.enum(['discover','nominate','enter','pay','draws']).default('discover'),
  }),
  requires: ['incentives'],
  capabilities: ['view','nominate','enter','pay','draws'],
}
```

**Gating:**
```sql
-- Check if user can nominate this horse for this program
select has_incentive_action(auth.uid(), horse_id, incentive_id);
-- Returns: true/false based on:
--   1. User has 'incentives' entitlement
--   2. User owns/is assigned to horse
--   3. Horse is eligible for program
```

### Pattern 2: GC → Subcontractors (Work Packages)

**Use Case**: General contractor assigns tasks to plumber, electrician, framer.

**Flow:**
1. GC creates work packages for project
2. Assigns each to subcontractor with role:
   ```sql
   insert into work_packages(
     project_id, role, title, assigned_to
   ) values (
     project_id, 'plumber', 'Install main lines', plumber_user_id
   );
   ```
3. Auto-creates connection:
   ```sql
   -- Trigger fires after assignment
   insert into connections(
     subject_type: 'user',
     subject_id: plumber_user_id,
     relation: 'assigned',
     object_type: 'work_package',
     object_id: work_package_id
   );
   ```
4. Plumber's dashboard auto-mounts work_packages kernel
5. Kernel shows only packages for their role

**Registry Entry:**
```typescript
work_packages: {
  id: 'work_packages',
  schema: z.object({
    project: z.string().uuid().optional(),
    role: z.enum(['plumber','electrician','framer','general','other']).optional(),
    range: z.enum(['week','month']).default('week'),
  }),
  requires: ['work_packages'],
  capabilities: ['view','update','complete'],
}
```

**RLS:**
```sql
create policy work_packages_access
  on work_packages for select
  using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or exists (
      select 1 from connections
      where subject_id = auth.uid()
        and object_type = 'project'
        and object_id = work_packages.project_id
    )
  );
```

### Pattern 3: Follow → Auto-Mount

**Use Case**: User follows an incentive program and wants updates on their dashboard.

**Flow:**
1. User clicks "Follow" on incentive program page
2. Creates connection:
   ```typescript
   await createConnection({
     subjectType: 'user',
     subjectId: userId,
     relation: 'follows',
     objectType: 'incentive',
     objectId: programId,
   });
   ```
3. Dashboard fetches connection-driven kernels:
   ```typescript
   const kernels = await getUserConnectionKernels();
   // Auto-mounts incentives kernel with program context
   ```
4. Kernel shows program status, deadlines, draws

**Auto-Mount Query:**
```sql
select 
  case c.object_type
    when 'incentive' then 'incentives'
    when 'project' then 'work_packages'
  end as kernel_type,
  c.object_id,
  c.metadata as context_data,
  case c.relation
    when 'owns' then 10
    when 'assigned' then 9
    when 'follows' then 5
  end as priority
from connections c
where c.subject_type = 'user'
  and c.subject_id = auth.uid()
order by priority desc;
```

## Utilities

### Opening Features with Context

```typescript
import { openFeaturesViaURL } from '@/feature-kernel/contextUtils';

// Open incentives for specific horse
openFeaturesViaURL({
  features: ['incentives'],
  props: { 
    incentives: { horse: horseId, mode: 'nominate' }
  }
});

// Open work packages for plumber role
openFeaturesViaURL({
  features: ['work_packages'],
  props: {
    work_packages: { project: projectId, role: 'plumber' }
  }
});
```

### Creating Connections

```typescript
import { createConnection } from '@/feature-kernel/contextUtils';

// User follows incentive
await createConnection({
  subjectType: 'user',
  subjectId: userId,
  relation: 'follows',
  objectType: 'incentive',
  objectId: programId,
});

// Auto-assigned via trigger (work packages)
// Connection created automatically when work package is assigned
```

### Checking Permissions

```typescript
import { hasIncentiveAction } from '@/feature-kernel/contextUtils';

const canNominate = await hasIncentiveAction({
  userId,
  horseId,
  incentiveId,
});
```

## Observability

All kernel actions log to `ai_action_ledger`:

```sql
insert into ai_action_ledger(user_id, agent, action, input, output, result)
values (
  auth.uid(),
  'user',
  'incentive_nominate',
  jsonb_build_object('horse_id', horse_id, 'incentive_id', incentive_id),
  jsonb_build_object('nomination_id', nomination_id),
  'success'
);
```

Query metrics:
```sql
select * from entitlement_gate_metrics(60) 
where source = 'incentives';
```

## Adding New Context-Aware Kernels

1. **Create connections** for the relationship:
   ```sql
   insert into connections(
     subject_type, subject_id, relation, object_type, object_id
   );
   ```

2. **Add registry entry** with context props:
   ```typescript
   my_feature: {
     schema: z.object({
       context_prop: z.string().optional(),
     }),
     requires: ['my_feature'],
   }
   ```

3. **Add gating function**:
   ```sql
   create function has_my_feature_action(user_id, context_id)
   returns boolean as $$
     select has_feature('my_feature', user_id)
       and exists (select 1 from connections where ...);
   $$;
   ```

4. **Use context utils**:
   ```typescript
   openFeaturesViaURL({
     features: ['my_feature'],
     props: { my_feature: { context_prop: value } }
   });
   ```

## Security Model

1. **Entitlements** (`has_feature`) gate access to the kernel
2. **Connections** gate specific actions within the kernel
3. **RLS policies** enforce data visibility
4. **SECURITY DEFINER functions** with admin checks handle mutations

## Best Practices

- Use connections for all relationships (follows, owns, assigned)
- Always check `has_feature` before showing mutation CTAs
- Log all actions to `ai_action_ledger` for observability
- Use expires_at for temporary access (e.g., trial periods)
- Auto-mount kernels based on priority (owns > assigned > follows)
- Pass minimal context props via URL (UUIDs only, not full objects)
