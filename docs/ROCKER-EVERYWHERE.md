# Rocker Everywhere

**Status**: ✅ Implemented  
**Goal**: Rocker observes, suggests, and acts in all 10 sections with minimal UI footprint

## Architecture

### Three Layers Per Section

1. **Observe** (Silent telemetry)
   - Fire `rocker_log_action` on page mount and key interactions
   - Respect consent via `rocker_check_consent`
   - Non-blocking, fails silently

2. **Suggest** (Lightweight UI)
   - Single `<RockerHint>` pill or `<RockerTray>` card
   - "Why this?" tooltip explains rationale
   - Accept/Dismiss feeds into `ai_feedback`

3. **Act** (Optional, flag-gated)
   - One safe, reversible action per section
   - Uses existing RPCs (module recommendation, theme, etc.)
   - User can undo/cancel

## Core Components

### `<RockerAgentProvider>`
Wraps the entire app (in `App.tsx`). Provides:
- `userId`: Current authenticated user
- `entityId`: Current workspace/entity context
- `route`: Current pathname
- `section`: Derived section name (discovery, marketplace, etc.)

### `useRocker()` Hook
The primary integration point for all sections:
```tsx
const { log, suggest, act, why, section } = useRocker();

// On mount
useEffect(() => {
  log('page_view', { section });
}, [log, section]);

// On user action
const handleClick = () => {
  log('cta_click', { cta_id: 'enter_event' });
};
```

### UI Components

- **`<WhyThis reason="...">`** - Help icon tooltip
- **`<RockerHint>`** - Single suggestion pill
- **`<RockerTray>`** - Multi-suggestion card (optional)

## Integration Per Section

### 1. Discovery (`/search`, `/feed`)
- **Observe**: `page_view:discovery`
- **Suggest**: "Improve my feed"
- **Act**: Auto-follow suggested entities (reversible)

### 2. Marketplace (`/marketplace`, `/cart`, `/orders`)
- **Observe**: Product views, ATC, purchases
- **Suggest**: Price suggestions, bundle offers
- **Act**: Apply suggestion to draft (not published)

### 3. Profiles (`/entities/:id`, `/entities/unclaimed`)
- **Observe**: Profile views, follow clicks
- **Suggest**: "Know this owner? Suggest claim"
- **Act**: Prefill claim draft

### 4. EquineStats (`/equinestats/*`)
- **Observe**: Horse/compare views
- **Suggest**: "Show likely tier this season"
- **Act**: Open compare with top comps

### 5. Events (Public) (`/events/*`)
- **Observe**: Event views, entry clicks
- **Suggest**: "Remind me before close"
- **Act**: Create reminder

### 6. My Entries (`/entries/*`)
- **Observe**: Views, filter usage
- **Suggest**: "Pack list / travel ETA"
- **Act**: Create checklist draft

### 7. Workspace Home (`/workspace/:entityId/dashboard`)
- **Observe**: Dashboard views, KPI changes
- **Suggest**: NBA Tray (top 3)
- **Act**: Accept module, theme change

### 8. Producer Events (`/workspace/:entityId/events/*`)
- **Observe**: Manage views, edits
- **Suggest**: "Add waitlist?"
- **Act**: Enable waitlist (flagged)

### 9. Programs (`/workspace/:entityId/programs`)
- **Observe**: Program edits
- **Suggest**: "Attach to 2 events"
- **Act**: Stage attach actions

### 10. Messaging (`/workspace/:entityId/messages`)
- **Observe**: Thread opens, replies
- **Suggest**: "Summarize / Smart reply"
- **Act**: Insert reply draft

## Rate Limiting

Each section can rate-limit suggestions:
```tsx
<RockerHint
  rateLimit="rocker_hint_discovery_feed"
  {...props}
/>
```
Uses localStorage; shows at most once per day per hint.

## CI Validation

**Script**: `scripts/validate-rocker-footprint.mjs`

Checks that each of the 10 sections:
1. Imports `useRocker` or mounts `<RockerHint>`
2. Calls `log('page_view', ...)` on mount

Runs in CI via `.github/workflows/show-your-work.yml`

## RPCs Used

- `rocker_log_action(user_id, agent, action, input, output, result)`
- `rocker_check_consent(user_id, action_type)`
- `recommend_workspace_modules(entity_id)`
- `accept_module_recommendation(entity_id, module)`
- `set_theme_overrides(subject_type, subject_id, tokens)`
- `get_theme(subject_type, subject_id)`
- `get_workspace_kpis(entity_id, horizon)`

All have RLS (self/members/admin as appropriate).

## Benefits

1. **Learning loops**: Rocker observes every interaction
2. **Consistent UX**: Same mental model across all sections
3. **Adaptive UI**: Suggestions improve over time
4. **Low friction**: Minimal UI, silent telemetry, consent-gated

## Next Steps

To integrate Rocker into a new section:
1. Add `const { log } = useRocker();` at top of component
2. Call `log('page_view')` in `useEffect(() => { ... }, [])`
3. Drop `<RockerHint>` where appropriate
4. Add suggestion/action logic as needed

See any existing section for reference patterns.
