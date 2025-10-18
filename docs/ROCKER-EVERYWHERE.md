# Rocker Everywhere

**Status**: ✅ Implemented  
**Goal**: Rocker observes, suggests, and acts in all 10 sections with minimal UI footprint

## Architecture

### Three Layers Per Section

1. **Observe** (Silent telemetry)
   - Fire `rocker_log_action` via `log()` on page mount and key interactions
   - Consent checked automatically via `rocker_check_consent`
   - Non-blocking, fails silently

2. **Suggest** (Lightweight UI)
   - Single `<RockerHint>` pill or `<RockerTray>` card
   - "Why this?" tooltip via `<WhyThis>` explains rationale
   - Accept/Dismiss feeds into telemetry

3. **Act** (Optional, flag-gated)
   - One safe, reversible action per section
   - Uses `act()` method with actionType routing
   - Logs success/error automatically

## Core API

### Single Hook: `useRocker()`

```tsx
import { useRocker } from '@/lib/ai/rocker/RockerProvider';

const { 
  userId,      // string | null
  entityId,    // string | null  
  route,       // string
  section,     // Section type
  log,         // (action, input?, output?, result?) => Promise<void>
  suggest,     // (kind?) => Promise<any[]>
  act,         // (actionType, params?) => Promise<{ success, data? }>
  why          // (reason) => string
} = useRocker();
```

### Section Types (10 exact)
- `discovery`
- `marketplace`
- `profiles`
- `equinestats`
- `events`
- `entries`
- `workspace_home`
- `producer_events`
- `programs`
- `messaging`

## Provider Setup

Mounted once at app root in `src/App.tsx`:

```tsx
<RockerProvider>
  <AppContent />
</RockerProvider>
```

Auto-derives:
- Section from current route
- EntityId from /workspace/:id or /entities/:id
- UserId from session

## UI Components

### `<RockerHint>` - Single suggestion pill
```tsx
<RockerHint
  suggestion="Enable Smart Pricing"
  reason="Expected +6-12% ATC from similar listings"
  rateLimit="hint:smart-pricing:v1"
  action={async () => {
    await act('accept_module', { module_key: 'pricing_hints' });
  }}
  actionLabel="Enable"
/>
```

### `<WhyThis>` - Info tooltip
```tsx
<WhyThis reason="Rocker noticed you haven't explored this yet" />
```

### `<RockerTray>` - Multi-suggestion card
```tsx
<RockerTray
  suggestions={[
    { id: '1', suggestion: 'Try X', reason: 'Because Y', action: async () => {} },
    { id: '2', suggestion: 'Try Z', reason: 'Because W' }
  ]}
  maxVisible={3}
/>
```

## Integration Per Section

### 1. Discovery (`/search`, `/feed`)
```tsx
useEffect(() => {
  log('page_view', { section: 'discovery' });
}, [log]);

<RockerHint
  suggestion="Try advanced filters to find your perfect match"
  reason="90% of users find relevant content faster with filters"
  rateLimit="hint:discovery-filters:v1"
/>
```

### 2. Marketplace (`/marketplace`, `/cart`, `/orders`)
```tsx
useEffect(() => {
  log('page_view', { section: 'marketplace' });
}, [log]);

<RockerHint
  suggestion="Enable price alerts for items you're watching"
  reason="Get notified when prices drop on saved items"
  rateLimit="hint:price-alerts:v1"
  action={async () => await act('enable_alerts')}
/>
```

### 3. Profiles (`/entities/:id`, `/entities/unclaimed`)
```tsx
useEffect(() => {
  log('page_view', { section: 'profiles', entity_id: entityId });
}, [log, entityId]);

<RockerHint
  suggestion="Know this owner? Help us verify this profile"
  reason="Verified profiles get more visibility"
  action={async () => navigate(`/claim/${entityId}`)}
  actionLabel="Claim Profile"
/>
```

### 4. EquineStats (`/equinestats/*`)
```tsx
useEffect(() => {
  log('page_view', { section: 'equinestats' });
}, [log]);

<RockerHint
  suggestion="Compare with similar horses to see tier potential"
  reason="Based on recent performance data"
  action={async () => act('open_compare', { horse_id: horseId })}
/>
```

### 5. Events (Public) (`/events/*`)
```tsx
useEffect(() => {
  log('page_view', { section: 'events', event_id: eventId });
}, [log, eventId]);

<RockerHint
  suggestion="Set a reminder before entries close"
  reason="Don't miss entry deadlines"
  action={async () => act('create_reminder', { event_id: eventId })}
/>
```

### 6. My Entries (`/entries/*`)
```tsx
useEffect(() => {
  log('page_view', { section: 'entries' });
}, [log]);

<RockerHint
  suggestion="Generate your event day checklist"
  reason="Packing lists based on venue and weather"
  action={async () => act('generate_checklist')}
/>
```

### 7. Workspace Home (`/workspace/:entityId/dashboard`)
```tsx
useEffect(() => {
  log('page_view', { section: 'workspace_home', entity_id: entityId });
}, [log, entityId]);

// Use RockerTray for NBA
<RockerTray suggestions={nbaSuggestions} maxVisible={3} />
```

### 8. Producer Events (`/workspace/:entityId/events/*`)
```tsx
useEffect(() => {
  log('page_view', { section: 'producer_events', entity_id: entityId });
}, [log, entityId]);

<RockerHint
  suggestion="Enable waitlist for sold-out classes"
  reason="Capture demand and fill cancellations"
  action={async () => act('enable_waitlist')}
/>
```

### 9. Programs (`/workspace/:entityId/programs`)
```tsx
useEffect(() => {
  log('page_view', { section: 'programs', entity_id: entityId });
}, [log, entityId]);

<RockerHint
  suggestion="Attach this program to 2 upcoming events"
  reason="Maximize participation with strategic placement"
  action={async () => act('suggest_event_attach', { program_id: programId })}
/>
```

### 10. Messaging (`/workspace/:entityId/messages`)
```tsx
useEffect(() => {
  log('page_view', { section: 'messaging', entity_id: entityId });
}, [log, entityId]);

<RockerHint
  suggestion="Use smart replies to respond faster"
  reason="AI-generated responses save time"
  action={async () => act('enable_smart_replies')}
/>
```

## Database

### Tables
- `ai_action_ledger` - All logged actions
- `user_consents` - Opt-in/out preferences
- `ai_consent` - Main consent table

### RPCs
- `rocker_check_consent(user_id, action_type)` - Returns `{allowed: boolean}`
- `rocker_log_action(user_id, agent, action, input, output, result, entity_id?, reason?)` - Inserts log

### RLS
- Self-access for own logs
- Admin read-all
- Consent: self-manage

## Rate Limiting

Rate limits are client-side via localStorage:
- Key format: `hint:{feature}:{version}`
- Shows at most once per 24 hours
- Dismissal persists across sessions

## CI Validation

**Script**: `scripts/validate-rocker-footprint.mjs`

Checks:
1. Each of 10 sections imports `useRocker`
2. Each calls `log('page_view')` on mount

Runs in CI: `.github/workflows/show-your-work.yml`

```bash
npm run validate:rocker
```

## Testing Checklist

- [ ] Visit all 10 section heads
- [ ] Confirm `page_view` logs in `ai_action_ledger`
- [ ] Set `user_consents.telemetry_basic=false` → no new logs
- [ ] Trigger hint → dismiss → refresh → should not reappear (24h)
- [ ] Accept action → verify success log with `result='success'`
- [ ] Test theme change: `act('set_theme', { tokens: {...} })`

## Benefits

1. **Consistent**: Same API across all sections
2. **Observable**: Every interaction logged (consent-gated)
3. **Adaptive**: Suggestions improve over time
4. **Low friction**: Minimal UI, silent telemetry
5. **Type-safe**: Full TypeScript support
6. **CI-validated**: Can't ship without Rocker

## Next Steps

To add Rocker to a new section:
1. `import { useRocker } from '@/lib/ai/rocker/RockerProvider'`
2. `const { log } = useRocker();`
3. `useEffect(() => { log('page_view'); }, [log]);`
4. Add `<RockerHint>` where appropriate

See `src/routes/search.tsx` for reference.
