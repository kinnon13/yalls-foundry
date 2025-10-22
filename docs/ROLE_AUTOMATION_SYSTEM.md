# Role-Based Automation System

## Overview

This system provides safe, auditable automation for different user roles:
- **User Rocker**: Full access to perform actions within their scope
- **Admin Rocker**: Audit and inspect data, simulate writes, needs elevation for real writes
- **Super Andy**: AI orchestrator that respects approval flows and logs everything

## Architecture

### 1. Capability Matrix (`src/security/capabilities.ts`)

Central truth for what each role can do:

```typescript
{
  user: {
    bus: { openApp: ['yallbrary', 'marketplace', ...], fill: true, click: true },
    api: { write: true, auditRead: false, simulate: false }
  },
  admin: {
    bus: { openApp: ['yallbrary', 'analytics', ...], fill: true, click: true },
    api: { write: false, auditRead: true, simulate: true }
  },
  super_admin: {
    bus: { openApp: [...all apps], fill: true, click: true },
    api: { write: true, auditRead: true, simulate: true }
  },
  agent_super_andy: {
    bus: { openApp: [...subset], fill: true, click: true },
    api: { write: false, auditRead: true, simulate: true }
  }
}
```

### 2. Automation Bus (`src/automation/bus.ts`)

Broadcast channel-based UI automation:

**Commands:**
- `openApp`: Navigate to an overlay
- `fill`: Type into form fields
- `click`: Click buttons/links
- `focus`: Focus elements

**Security:**
- Every command checked against capability matrix
- Role verified before execution
- Blocked commands emit events for logging

**Usage:**
```typescript
import { openApp, fillField, clickElement } from '@/automation/bus';

// Open Yallbrary
openApp('yallbrary', { search: 'bridles' });

// Fill search field
fillField('[data-testid="yallbrary-search"]', 'horse tack');

// Click search button
clickElement('[data-testid="yallbrary-search-btn"]');
```

### 3. Admin Audit Function (`supabase/functions/admin_audit_query`)

Read-only queries for admin auditing:

**Allowed Views:**
- `v_orders_summary` - Order statistics
- `v_user_activity` - User engagement
- `v_ai_costs` - AI usage costs
- `v_incidents_summary` - System health
- `v_model_usage` - Model routing stats
- `v_budget_status` - Budget utilization

**Security:**
- Role must be admin/super_admin/agent_super_andy
- Only whitelisted views accessible
- Tenant isolation enforced
- All queries logged to `ai_action_ledger`

**Usage:**
```typescript
const { data } = await supabase.functions.invoke('admin_audit_query', {
  body: {
    view: 'v_orders_summary',
    filters: { created_at: 'gte.2025-01-01' },
    tenantId: 'tenant-123',
    role: 'admin'
  }
});
```

### 4. Approval Flow (`src/utils/approvalFlow.ts`)

User preference-based approval for sensitive actions:

**Modes:**
- `ask`: Show confirmation dialog
- `auto`: Execute immediately
- `never`: Block all automated actions

**Usage:**
```typescript
import { maybeRunWithApproval } from '@/utils/approvalFlow';

const result = await maybeRunWithApproval(
  userId,
  {
    actionSummary: 'Post announcement to marketplace',
    actionType: 'post',
    context: { title: 'New Product Launch' }
  },
  async () => {
    return await createPost({ ... });
  }
);

if (result.success) {
  toast.success('Posted!');
} else {
  toast.error(result.error);
}
```

## User Flows

### User Rocker
1. Opens app via bus: `openApp('marketplace')`
2. Types into search: `fillField('[data-testid="search"]', 'saddles')`
3. Clicks search: `clickElement('[data-testid="search-btn"]')`
4. Creates post via API (RLS-scoped to their tenant)
5. All actions logged

### Admin Rocker
1. Opens app for UI testing: `openApp('marketplace')`
2. Fills fields to test forms: `fillField(...)`
3. Runs audit query: `supabase.functions.invoke('admin_audit_query', ...)`
4. Attempts write → Blocked or Simulated
5. Can request elevation from super_admin

### Super Andy
1. Checks user's `approval_mode`
2. If `ask`: Shows confirmation dialog
3. If approved: Executes bus commands + API calls
4. Logs everything to `ai_action_ledger`
5. Respects capability matrix (no writes without approval)

## Database Schema

### Audit Views
All views use tenant isolation and date ranges for performance.

### Action Ledger
```sql
table ai_action_ledger (
  tenant_id uuid,
  user_id uuid,
  topic text,  -- e.g., 'admin.audit.query', 'action.post', 'bus:blocked'
  payload jsonb,
  created_at timestamptz
)
```

## Testing

### E2E Tests (`tests/e2e/roles-automation.spec.ts`)

Validates:
- User can open apps and perform actions
- Admin can audit but not write
- Bus blocks unauthorized access
- Super Andy respects capabilities

**Run:**
```bash
pnpm exec playwright test tests/e2e/roles-automation.spec.ts
```

## UI Integration

### Add Automation Bus to App

```tsx
// In src/App.tsx or main layout
import { useEffect } from 'react';
import { registerAutomationHandlers } from '@/automation/bus';

export default function App() {
  useEffect(() => {
    registerAutomationHandlers();
  }, []);

  return <YourApp />;
}
```

### Use Hook in Components

```tsx
import { useAutomationBus } from '@/hooks/useAutomationBus';

function MyComponent() {
  const { openApp, isAllowed, role } = useAutomationBus();

  return (
    <div>
      <p>Role: {role}</p>
      {isAllowed('bus', 'yallbrary') && (
        <button onClick={() => openApp('yallbrary')}>
          Open Yallbrary
        </button>
      )}
    </div>
  );
}
```

### Add Approval Dialog

Listen for approval requests:

```tsx
useEffect(() => {
  const handler = (e: Event) => {
    const { request, onApprove, onReject } = (e as CustomEvent).detail;
    
    // Show modal
    showConfirmDialog({
      title: 'Confirm Action',
      message: request.actionSummary,
      onConfirm: onApprove,
      onCancel: () => onReject('User cancelled'),
    });
  };

  window.addEventListener('approval:request', handler);
  return () => window.removeEventListener('approval:request', handler);
}, []);
```

## Security Considerations

1. **Capability Matrix** - Single source of truth for permissions
2. **Tenant Isolation** - All queries enforce tenant_id
3. **Audit Logging** - Every action logged to ai_action_ledger
4. **View Whitelist** - Only approved views accessible
5. **Role Verification** - Checked both client and server-side
6. **Approval Flow** - Sensitive actions require confirmation

## Next Steps

1. **Elevation Flow**: Add super_admin toggle for temporary admin write access
2. **Audit Views**: Create remaining views (v_system_health, v_performance_metrics)
3. **UI Indicators**: Add "Read-Only" pill to Admin Rocker
4. **Test IDs**: Add data-testid to all automation targets
5. **Monitoring**: Dashboard showing bus activity and blocked commands

## Troubleshooting

**Bus commands not working:**
- Check `registerAutomationHandlers()` is called on app startup
- Verify role in localStorage: `localStorage.getItem('devRole')`
- Check browser console for block messages

**Audit queries failing:**
- Verify view exists: `select * from v_orders_summary limit 1`
- Check role is allowed: admin/super_admin/agent_super_andy
- Ensure tenant_id is provided

**Approval not showing:**
- Listen for `approval:request` event
- Check user's `approval_mode` in ai_user_profiles
- Verify approval dialog component is mounted
