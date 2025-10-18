# Rocker Integration Guide

**Quick Reference**: How to add Rocker to any section

## Minimal Integration (3 steps)

### 1. Import the hook
```tsx
import { useRocker } from '@/lib/ai/rocker/RockerProvider';
```

### 2. Log page views
```tsx
const { log, section } = useRocker();

useEffect(() => {
  log('page_view', { section });
}, [log, section]);
```

### 3. Add a hint (optional)
```tsx
import { RockerHint } from '@/components/rocker/RockerHint';

<RockerHint
  suggestion="Your suggestion text"
  reason="Why Rocker is suggesting this"
  rateLimit="hint:my-feature:v1"
  action={async () => {
    // Optional action
    await act('my_action', { param: 'value' });
  }}
  actionLabel="Enable"
/>
```

## Complete API

### `useRocker()` Returns:
```typescript
{
  userId: string | null;        // Current user
  entityId: string | null;      // Current workspace/entity
  route: string;                 // Current path
  section: Section;              // One of 10 sections
  
  // Methods
  log: (action, input?, output?, result?) => Promise<void>;
  suggest: (kind?) => Promise<any[]>;
  act: (actionType, params?) => Promise<{ success: boolean; data?: any }>;
  why: (reason) => string;
}
```

### Sections (10 total):
- `discovery` - /search, /feed
- `marketplace` - /marketplace, /listings, /cart, /orders
- `profiles` - /entities/:id, /u/:handle
- `equinestats` - /equinestats/*
- `events` - /events/* (public)
- `entries` - /entries/*, /entrant/*
- `workspace_home` - /workspace/:entityId/dashboard
- `producer_events` - /workspace/:entityId/events/*
- `programs` - /workspace/:entityId/programs, /incentives/*
- `messaging` - /workspace/:entityId/messages, /messages

## Common Patterns

### Log user actions
```tsx
const handleClick = () => {
  log('cta_click', { 
    cta_id: 'enter_event',
    event_id: eventId 
  });
};
```

### Show conditional hints
```tsx
{showHint && (
  <RockerHint
    suggestion="Enable notifications"
    reason="Get alerted when entries close"
    rateLimit="hint:notifications:v1"
  />
)}
```

### Act on user choice
```tsx
const enableFeature = async () => {
  const result = await act('enable_module', {
    module_key: 'smart_pricing'
  });
  
  if (result.success) {
    toast({ title: 'Feature enabled' });
  }
};
```

## Rate Limiting

Use `rateLimit` prop to show hints at most once per day:
- Format: `"hint:{feature}:{version}"`
- Example: `"hint:smart-pricing:v1"`
- Stored in localStorage
- Resets after 24 hours

## UI Components

### `<RockerHint>` - Single suggestion
Lightweight pill with optional CTA and dismiss button.

### `<WhyThis>` - Rationale tooltip
Info icon with explanation tooltip.

### `<RockerTray>` - Multiple suggestions
Card container for 3-5 suggestions with collapse/expand.

## Testing Checklist

- [ ] `useRocker` imported
- [ ] `log('page_view')` called on mount
- [ ] Section name matches one of 10
- [ ] Consent is respected (RPCs handle this)
- [ ] Rate limits work (test localStorage)
- [ ] Actions log success/error

## CI Validation

Run `npm run validate:rocker` to check all 10 sections have:
1. `useRocker` import
2. `log('page_view')` call

Runs automatically in CI via `.github/workflows/show-your-work.yml`
