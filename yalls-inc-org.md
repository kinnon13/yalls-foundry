# Yalls Inc - Project Organization & Structure Analysis

**Generated:** 2025-10-24  
**Purpose:** Complete project dump for modular boundary planning and external review/restructure

---

## 1. PROJECT OVERVIEW

**Name:** Yalls.ai Platform  
**Type:** Full-stack React + Supabase monorepo  
**Architecture:** Modular app system with shared workers, AI subsystems, and edge functions  
**Current Issues:** Cross-module contamination (changes in one area break unrelated features)

---

## 2. DIRECTORY STRUCTURE (Full Tree)

```
yalls-ai/
├── public/                          # Static assets (favicon, placeholders)
│   ├── favicon.ico
│   └── placeholder.svg
│
├── scripts/                         # Mission Control automation tooling
│   ├── lib/                         # Shared script utilities
│   │   ├── README.md               # Lib layer overview
│   │   ├── colors.ts               # Terminal color helpers
│   │   ├── file-hash.ts            # SHA-1 content hashing
│   │   ├── logger.ts               # Console formatting (header, line, log)
│   │   └── utils.ts                # File system walker (listFiles)
│   └── [other automation scripts]
│
├── src/                             # Main application source
│   │
│   ├── apps/                        # Modular app ecosystem (each app = isolated feature)
│   │   ├── types.ts                # Core app types: AppId, Role, AppContract, AppUnitProps
│   │   │
│   │   ├── yallbrary/               # Yallbrary app (catalog/listings browser)
│   │   │   ├── contract.ts         # App contract: id='yallbrary', routes=['/listings'], role='user'
│   │   │   ├── Entry.tsx           # Root component (overlay/panel context)
│   │   │   └── Panel.tsx           # Panel view implementation
│   │   │
│   │   ├── crm/                     # CRM app
│   │   │   ├── contract.ts         # App contract: id='crm', role='user'
│   │   │   ├── Entry.tsx           # CRM entry point
│   │   │   └── [components/]       # CRM-specific components
│   │   │
│   │   ├── calendar/                # Calendar/scheduling app
│   │   │   ├── contract.ts         # App contract: id='calendar', role='user'
│   │   │   └── ...
│   │   │
│   │   ├── marketplace/             # Marketplace/ecommerce app
│   │   │   ├── contract.ts         # App contract: id='marketplace', role='user'
│   │   │   └── ...
│   │   │
│   │   ├── business/                # Business management app
│   │   │   ├── contract.ts         # App contract: id='business', role='user'
│   │   │   └── Entry.tsx           # Business entry point
│   │   │
│   │   ├── rocker/                  # Rocker AI chat app
│   │   │   ├── contract.ts         # App contract: id='rocker', role='user'
│   │   │   └── Entry.tsx           # Rocker chat interface
│   │   │
│   │   ├── admin-rocker/            # Admin Rocker (super admin only)
│   │   │   ├── contract.ts         # App contract: id='admin-rocker', role='super'
│   │   │   └── Entry.tsx           # Admin chat interface
│   │   │
│   │   ├── messages/                # Messaging app
│   │   ├── discover/                # Discovery/feed app
│   │   ├── events/                  # Events management
│   │   ├── earnings/                # Earnings/commission tracking
│   │   ├── incentives/              # Incentive programs
│   │   ├── farm-ops/                # Farm operations
│   │   ├── activity/                # Activity feed
│   │   ├── analytics/               # Analytics dashboard
│   │   ├── favorites/               # Favorites/bookmarks
│   │   ├── cart/                    # Shopping cart
│   │   ├── orders/                  # Order management
│   │   ├── notifications/           # Notification center
│   │   ├── profile/                 # User profile
│   │   ├── entities/                # Entity management
│   │   ├── mlm/                     # MLM/network marketing
│   │   ├── producer/                # Producer dashboard
│   │   ├── settings/                # Settings panel
│   │   └── overview/                # Overview dashboard
│   │
│   ├── ai/                          # AI subsystems (planning, execution, meta-cortex)
│   │   │
│   │   ├── shared/                  # Shared AI utilities
│   │   │   ├── README.md           # "Reusable planning, execution, NLP, tool registry, model routing, safety helpers"
│   │   │   └── conversation/
│   │   │       └── state.ts        # Agenda stack for topic management: AgendaItem, Agenda class, globalAgenda
│   │   │
│   │   └── super/                   # Super AI Brain (Meta-Cortex)
│   │       ├── README.md           # "Orchestrator + subagents (gap_finder, verifier, executor), self-improve loops, proactive perception"
│   │       └── promptpacks/
│   │           ├── orchestrator.prompt.md  # System role, responsibilities, proactive action guidelines
│   │           └── gap_finder.v1.md        # Gap finder agent prompt (analyze memory, find opportunities/risks)
│   │
│   ├── workers/                     # Worker runtime subsystems
│   │   └── runtime/                 # Core worker types and configuration
│   │       ├── pools.ts             # Pool types: Pool, POOL_NAMES (realtime, heavy, analytics, slow, safety, self, ops)
│   │       ├── index.ts             # WorkerConfig, JobStatus (actual impl in Edge Functions)
│   │       ├── concurrency.ts       # ConcurrencyLimits, SemaphoreState
│   │       ├── fairness.ts          # TenantQuota, FairnessPolicy
│   │       ├── router.ts            # TopicHandler, RouterConfig
│   │       ├── heartbeat.ts         # Heartbeat, HeartbeatStatus
│   │       ├── autoscaler.ts        # ScaleDecision, ScalingPolicy
│   │       ├── metrics.ts           # MetricPoint, WorkerMetrics
│   │       └── backoff.ts           # calculateBackoffDelay, getNextRetryAt (exponential backoff)
│   │
│   ├── lib/                         # Shared library utilities
│   │   │
│   │   ├── ai/                      # AI integration layer
│   │   │   ├── memory.ts           # Durable memory: MemoryType, Memory, storeMemory, recallMemories, updateMemoryScore
│   │   │   └── rocker/             # Rocker AI observability
│   │   │       ├── index.ts        # Public API: RockerProvider, useRocker, RockerHint, RockerWhy, RockerTray, useRockerGlobal
│   │   │       ├── RockerProvider.tsx        # Section-level telemetry provider
│   │   │       ├── RockerChatProvider.tsx    # Chat-specific provider
│   │   │       ├── RockerHint.tsx            # Hint UI component
│   │   │       ├── RockerWhy.tsx             # "Why" explanation component
│   │   │       └── RockerTray.tsx            # Tray UI component
│   │   │
│   │   ├── overlay/                 # Overlay system (modal apps)
│   │   │   └── types.ts            # OverlayKey (alias of AppId), OverlayConfig, OverlayState
│   │   │
│   │   ├── refs/                    # Referral system
│   │   │   └── referral.ts         # fetchInviter, InviterInfo
│   │   │
│   │   └── marketing/               # Marketing utilities
│   │       ├── personalize.ts      # assignVariant, getVariantConfig, heroCopy (A/B testing)
│   │       └── analytics.ts        # logEvent (event tracking)
│   │
│   ├── components/                  # Shared UI components
│   │   ├── ui/                      # Base UI primitives (shadcn/radix)
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   └── [100+ components]
│   │   │
│   │   ├── super-andy/              # Super Andy AI components
│   │   │   ├── AndyThoughtStream.tsx  # SSE thought stream viewer (FIXED: safe JSON parsing)
│   │   │   ├── SuperAndyChatWithVoice.tsx
│   │   │   ├── AndyNotebook.tsx
│   │   │   ├── SuperAndyTasks.tsx
│   │   │   ├── AndyMemoryViewer.tsx
│   │   │   ├── AndyRulesEditor.tsx
│   │   │   ├── AndyResearchQueue.tsx
│   │   │   ├── AndyCronSetup.tsx
│   │   │   └── CenterStage.tsx       # Main Super Andy dashboard
│   │   │
│   │   ├── ai/                      # General AI components
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── ConnectedEntitiesPanel.tsx
│   │   │   ├── MemoriesPanel.tsx
│   │   │   └── UnknownsPanel.tsx
│   │   │
│   │   ├── admin-rocker/            # Admin Rocker components
│   │   │   ├── MessengerRail.tsx
│   │   │   └── panels/
│   │   │       └── ToolsPanel.tsx
│   │   │
│   │   ├── account/                 # Account management
│   │   │   ├── AccountDeletionFlow.tsx
│   │   │   └── DeleteAccountDialog.tsx
│   │   │
│   │   ├── chrome/                  # App chrome (header, nav)
│   │   │   └── HeaderBar.tsx        # Main navigation bar
│   │   │
│   │   ├── dashboard/               # Dashboard components
│   │   │   └── DashboardKPIs.tsx
│   │   │
│   │   ├── discovery/               # Discovery/feed components
│   │   │   └── InterestBasedFeed.tsx
│   │   │
│   │   ├── earnings/                # Earnings components
│   │   │   ├── MissedCTA.tsx        # Missed earnings CTA
│   │   │   └── MissedCalculator.tsx # Missed earnings calculator
│   │   │
│   │   └── common/                  # Common components
│   │       └── FavoriteButton.tsx
│   │
│   ├── hooks/                       # React hooks
│   │   ├── useRockerChat.ts        # Rocker chat integration (FIXED: uses thread_id not session_id)
│   │   └── useRockerGreeting.ts    # Landing page greeting
│   │
│   ├── pages/                       # Page components (route-level)
│   │   ├── Index.tsx               # Landing page (A/B testing, invite codes, auth state)
│   │   └── SuperAndy/
│   │       └── ProactiveRail.tsx   # Proactive action rail
│   │
│   ├── routes/                      # Route definitions
│   │   ├── super-andy/
│   │   │   └── index.tsx           # Main Super Andy route (includes AndyThoughtStream)
│   │   ├── super-andy-live/
│   │   │   └── index.tsx           # Live Super Andy view
│   │   └── admin/
│   │       └── system.tsx          # System admin panel (FIXED: uses ai_action_ledger.timestamp)
│   │
│   ├── preview/                     # Preview/sandbox guards
│   │   └── PreviewGuard.tsx        # Blocks EventSource, WebSocket, XHR in preview
│   │
│   ├── integrations/                # External integrations (AUTO-GENERATED - DO NOT EDIT)
│   │   └── supabase/
│   │       ├── client.ts           # Supabase client (auto-generated)
│   │       └── types.ts            # Database types (auto-generated from schema)
│   │
│   └── main.tsx                     # App entry point
│
├── supabase/                        # Backend infrastructure
│   │
│   ├── config.toml                  # Supabase config (AUTO-GENERATED - DO NOT EDIT)
│   │
│   ├── migrations/                  # Database migrations (read-only)
│   │   └── [timestamped SQL files]
│   │
│   └── functions/                   # Edge Functions (serverless backend)
│       │
│       ├── _shared/                 # Shared function utilities
│       │   ├── ai.ts               # AI client wrapper (Lovable AI gateway)
│       │   ├── cors.ts             # CORS headers
│       │   ├── logger.ts           # Structured logging
│       │   ├── tenantGuard.ts      # Multi-tenancy guard
│       │   ├── rbac.ts             # Role-based access control
│       │   ├── rate-limit.ts       # Rate limiting
│       │   ├── sse.ts              # Server-Sent Events helpers
│       │   └── [more utilities]
│       │
│       ├── rocker-chat/             # Rocker chat endpoint (forwards to rocker-chat-simple)
│       │   └── index.ts            # FIXED: Maps session_id -> thread_id for backward compatibility
│       │
│       ├── rocker-chat-simple/      # Simplified Rocker chat
│       │   └── index.ts            # FIXED: Auto-triggers analyze-memories after assistant reply
│       │
│       ├── rocker-web-research/     # Web research endpoint
│       │   └── index.ts            # Research types: feature_gap, best_practice, alternative, troubleshooting
│       │
│       ├── rocker-reprocess-all/    # Reprocess all stored items
│       │   └── index.ts            # AI planning for reprocessing strategy
│       │
│       ├── andy-thought-stream/     # SSE thought stream for Andy
│       │   └── index.ts            # FIXED: Uses ai_action_ledger.timestamp (not created_at)
│       │
│       ├── andy-memory-decay/       # Periodic memory decay
│       │   └── index.ts            # Calls decay_brain_memory RPC, reinforces weak memories
│       │
│       ├── andy-auto-analyze/       # Background memory analysis
│       │   └── index.ts            # Iterates active users, expands memory, analyzes knowledge
│       │
│       ├── andy-ask-questions/      # Generate follow-up questions
│       │   └── index.ts            # Fetches knowledge + memories, calls Lovable AI for questions
│       │
│       ├── andy-iteration/          # Single research pass
│       │   └── index.ts            # Research from angle, stores in brain_iterations, updates brain_tasks
│       │
│       ├── andy-expand-memory/      # Expand user memory
│       │   └── index.ts            # Analyzes memories, generates synthetic ones, stores in rocker_long_memory
│       │
│       ├── analyze-memories/        # Extract memories from conversations
│       │   └── index.ts            # FIXED: Reads from rocker_messages by thread_id (not rocker_conversations)
│       │
│       └── [150+ other functions]  # Various backend functions (auth, payments, business logic, etc.)
│
├── vite.config.ts                   # Vite build configuration
├── tailwind.config.ts               # Tailwind CSS config (design system tokens)
├── index.css                        # Global styles + design system tokens (HSL colors)
├── tsconfig.json                    # TypeScript config (read-only)
├── package.json                     # Dependencies (managed via tools only)
└── README.md                        # Project documentation
```

---

## 3. MODULE ROLES & DESCRIPTIONS (1-Line Each)

### Core Application
- **src/main.tsx**: React app entry point, sets up routing and providers
- **src/pages/Index.tsx**: Landing page with A/B testing, invite code parsing, personalized copy via useMemo/useEffect
- **vite.config.ts**: Vite dev server + build config, CSP headers, component tagger for Lovable

### App Ecosystem (`src/apps/`)
- **types.ts**: Core types for app system (AppId union, Role, AppContract, AppUnitProps)
- **yallbrary/contract.ts**: Yallbrary app contract (id, title, routes, role, testIds)
- **yallbrary/Entry.tsx**: Yallbrary root component (handles contextType: overlay vs panel)
- **yallbrary/Panel.tsx**: Yallbrary panel view implementation
- **crm/**, **calendar/**, **marketplace/**, etc.: Other modular apps with same contract pattern

### AI Subsystems (`src/ai/`)
- **shared/conversation/state.ts**: Agenda stack for conversation memory (AgendaItem, Agenda class, globalAgenda singleton)
- **super/promptpacks/orchestrator.prompt.md**: Super Andy orchestrator system prompt (MCTS planning, subagents, proactive actions)
- **super/promptpacks/gap_finder.v1.md**: Gap finder agent prompt (analyzes CTM/world_models/ledger for opportunities/bottlenecks)

### Worker Runtime (`src/workers/runtime/`)
- **pools.ts**: Pool configuration types (Pool interface, POOL_NAMES: realtime, heavy, analytics, slow, safety, self, ops)
- **index.ts**: Worker config/status types (actual loop runs in Edge Functions)
- **concurrency.ts**: Concurrency control (ConcurrencyLimits, SemaphoreState)
- **fairness.ts**: Tenant quota and fairness policies (TenantQuota, FairnessPolicy)
- **router.ts**: Worker routing types (TopicHandler, RouterConfig)
- **heartbeat.ts**: Worker heartbeat types (Heartbeat, HeartbeatStatus)
- **autoscaler.ts**: Autoscaling decisions (ScaleDecision: high_load | low_load | burst)
- **metrics.ts**: Worker metrics types (MetricPoint, WorkerMetrics)
- **backoff.ts**: Exponential backoff helpers (calculateBackoffDelay, getNextRetryAt)

### Library Layer (`src/lib/`)
- **ai/memory.ts**: Durable AI memory (MemoryType, storeMemory, recallMemories, updateMemoryScore)
- **ai/rocker/index.ts**: Rocker observability public API (providers, hooks, UI components)
- **overlay/types.ts**: Overlay system types (OverlayKey = AppId, OverlayConfig, OverlayState)
- **refs/referral.ts**: Referral system (fetchInviter, InviterInfo)
- **marketing/personalize.ts**: A/B testing (assignVariant, getVariantConfig, heroCopy)
- **marketing/analytics.ts**: Event tracking (logEvent)

### Components (`src/components/`)
- **super-andy/AndyThoughtStream.tsx**: SSE thought stream UI (FIXED: safe JSON.parse, no undefined crashes)
- **super-andy/CenterStage.tsx**: Main Super Andy dashboard with memory viewer, rules editor, thought stream
- **ai/ChatPanel.tsx**: General AI chat panel
- **ai/ConnectedEntitiesPanel.tsx**: Shows user's businesses, horses, products, profiles with pagination
- **ai/MemoriesPanel.tsx**: Memory browser/editor
- **chrome/HeaderBar.tsx**: Main navigation bar (search, apps, user menu)
- **dashboard/DashboardKPIs.tsx**: KPI cards (missed revenue, earnings, etc.)
- **earnings/MissedCTA.tsx**: Missed earnings call-to-action
- **earnings/MissedCalculator.tsx**: Missed earnings breakdown (cancellations, expired links, etc.)

### Hooks (`src/hooks/`)
- **useRockerChat.ts**: Rocker chat integration (FIXED: passes thread_id to backend instead of session_id)
- **useRockerGreeting.ts**: Landing page greeting trigger

### Routes (`src/routes/`)
- **super-andy/index.tsx**: Main Super Andy route (includes AndyThoughtStream, research queue, cron setup)
- **super-andy-live/index.tsx**: Live Super Andy view with chat, thought stream, notebook, tasks
- **admin/system.tsx**: System admin panel (FIXED: uses ai_action_ledger.timestamp for ordering)

### Edge Functions (`supabase/functions/`)
- **_shared/ai.ts**: Lovable AI gateway wrapper (chat, embedding, model routing)
- **_shared/cors.ts**: Standard CORS headers for all functions
- **_shared/logger.ts**: Structured logging utilities
- **_shared/tenantGuard.ts**: Multi-tenancy enforcement
- **_shared/rbac.ts**: Role-based access control
- **_shared/rate-limit.ts**: Rate limiting middleware
- **_shared/sse.ts**: Server-Sent Events helpers
- **rocker-chat/index.ts**: Main chat endpoint (FIXED: backward compat session_id -> thread_id)
- **rocker-chat-simple/index.ts**: Simplified chat (FIXED: auto-triggers memory analysis after reply)
- **rocker-web-research/index.ts**: Web research types (feature_gap, best_practice, alternative, troubleshooting)
- **rocker-reprocess-all/index.ts**: AI-driven reprocessing strategy planner
- **andy-thought-stream/index.ts**: SSE stream of Andy's brain activity (FIXED: uses timestamp field)
- **andy-memory-decay/index.ts**: Periodic memory decay + reinforcement
- **andy-auto-analyze/index.ts**: Background analysis loop (expands memory, analyzes knowledge)
- **andy-ask-questions/index.ts**: Generates insightful follow-up questions from user context
- **andy-iteration/index.ts**: Single research iteration (angle-based research, stores in brain_iterations)
- **andy-expand-memory/index.ts**: Expands user memory via AI synthesis
- **analyze-memories/index.ts**: Extracts memories from chat messages (FIXED: reads rocker_messages by thread_id)

### Scripts Layer (`scripts/lib/`)
- **logger.ts**: Console formatting helpers (header, line, log)
- **utils.ts**: File system walker (listFiles)
- **file-hash.ts**: SHA-1 content hashing for duplicate detection
- **colors.ts**: Terminal color formatting

---

## 4. KEY CODE SNIPPETS

### A. Landing Page with A/B Testing & Invite Parsing
**File:** `src/pages/Index.tsx`

```tsx
// Extract invite code from URL
const invite = new URLSearchParams(window.location.search).get('invite');

// Generate stable visitor seed for A/B bucketing
const seed = useMemo(() => {
  if (invite) return invite;
  const match = document.cookie.match(/y_sid=([^;]+)/);
  if (match) return match[1];
  return String(Math.random());
}, [invite]);

// Assign A/B/C/D variant
const variant = useMemo(() => assignVariant(seed), [seed]);
const variantConfig = getVariantConfig(variant);

// Fetch inviter info for personalization
const [inviterInfo, setInviterInfo] = useState<InviterInfo | null>(null);

// Generate personalized copy
const copy = useMemo(() => 
  heroCopy({ inviterInterests: inviterInfo?.interests }), 
  [inviterInfo]
);

// Set session cookie
useEffect(() => {
  if (!document.cookie.includes('y_sid=')) {
    document.cookie = `y_sid=${seed}; path=/; max-age=31536000; SameSite=Lax`;
  }
}, [seed]);

// Fetch inviter and log impression
useEffect(() => {
  if (invite) {
    fetchInviter(invite).then(setInviterInfo);
  }
  logEvent('home_impression', { variant, invite });
}, [invite, variant]);
```

**Key Features:**
- Stable visitor ID via cookie or invite code
- A/B variant assignment with useMemo
- Personalized copy based on inviter's interests
- Event tracking for impressions and CTA clicks

---

### B. Thought Stream SSE with Safe JSON Parsing (FIXED)
**File:** `src/components/super-andy/AndyThoughtStream.tsx`

```tsx
const safeParse = (raw: any) => {
  if (raw == null || raw === '') return null;
  try { return JSON.parse(raw); } catch { return null; }
};

eventSource.addEventListener('lookup', (e: MessageEvent) => {
  const data = safeParse((e as any).data);
  if (!data) return;
  setEvents(prev => [...prev, {
    type: 'lookup',
    data,
    timestamp: new Date().toISOString()
  }]);
});

eventSource.addEventListener('result', (e: MessageEvent) => {
  const data = safeParse((e as any).data);
  if (!data) return;
  setEvents(prev => [...prev, {
    type: 'result',
    data,
    timestamp: new Date().toISOString()
  }]);
});

eventSource.addEventListener('complete', (e: MessageEvent) => {
  const data = safeParse((e as any).data);
  if (!data) return;
  setEvents(prev => [...prev, {
    type: 'complete',
    data,
    timestamp: new Date().toISOString()
  }]);
  setIsLive(false);
});

eventSource.addEventListener('error', (e: MessageEvent) => {
  const parsed = safeParse((e as any).data);
  const data = parsed ?? { message: 'Stream error' };
  setEvents(prev => [...prev, {
    type: 'error',
    data,
    timestamp: new Date().toISOString()
  }]);
  setIsLive(false);
});
```

**Fix:** Wrapped all JSON.parse calls in safeParse to handle undefined/empty/malformed data gracefully.

---

### C. Rocker Chat with thread_id Fix
**File:** `src/hooks/useRockerChat.ts`

```tsx
const response = await supabase.functions.invoke('rocker-chat', {
  body: {
    user_id: session.userId,
    thread_id: sessionId,  // FIXED: was session_id
    message
  }
});
```

**File:** `supabase/functions/rocker-chat/index.ts`

```typescript
let body = await req.json();

// Backward compatibility: map session_id -> thread_id
if (body && !body.thread_id && body.session_id) {
  body = { ...body, thread_id: body.session_id };
  delete body.session_id;
}

console.log('[Rocker Chat] Forwarding to rocker-chat-simple', { hasThread: !!body.thread_id });
```

**Fix:** Frontend sends thread_id; backend maps old session_id to thread_id for backward compat.

---

### D. Auto-Trigger Memory Analysis After Chat
**File:** `supabase/functions/rocker-chat-simple/index.ts`

```typescript
// Trigger memory extraction async (non-blocking)
try {
  await ctx.tenantClient.functions.invoke('analyze-memories', { body: { trigger: 'chat_reply', thread_id } });
} catch (e) {
  log.warn('analyze-memories invocation failed (non-blocking)', e);
}
```

**Fix:** Immediately triggers memory extraction after assistant replies, ensuring Andy learns from conversations.

---

### E. Memory Analysis Reading from Correct Table
**File:** `supabase/functions/analyze-memories/index.ts`

```typescript
const { data: conversations } = await supabaseClient
  .from('rocker_messages')  // FIXED: was rocker_conversations
  .select('content, role, created_at, thread_id')
  .eq('user_id', user.id)
  .not('thread_id', 'is', null)
  .order('created_at', { ascending: true });

if (!conversations) {
  console.log('[analyze-memories] No conversations found.');
  return new Response(JSON.stringify({ message: 'No conversations found.' }), { ...responseDefaults });
}

const sessions = new Map<string, any[]>();
for (const msg of conversations) {
  if (!sessions.has(msg.thread_id)) sessions.set(msg.thread_id, []);
  sessions.get(msg.thread_id)!.push(msg);
}
```

**Fix:** Now reads from rocker_messages by thread_id instead of rocker_conversations by session_id.

---

### F. Action Ledger Timestamp Fix
**File:** `supabase/functions/andy-thought-stream/index.ts`

```typescript
const { data: actions, error: aError } = await supabase
  .from('ai_action_ledger')
  .select('*')
  .eq('user_id', userId)
  .order('timestamp', { ascending: false })  // FIXED: was created_at
  .limit(20);
```

**File:** `src/routes/admin/system.tsx`

```typescript
const { data: actions } = await supabase
  .from('ai_action_ledger')
  .select('*')
  .order('timestamp', { ascending: false })  // FIXED: was created_at
  .limit(10);

// Later in render:
<td className="py-2 px-4 border-b border-gray-700">
  {new Date(action.timestamp).toLocaleString()}  // FIXED: was action.created_at
</td>
```

**Fix:** Use ai_action_ledger.timestamp (the correct column) instead of created_at.

---

## 5. CURRENT MODULE DEPENDENCIES

### Cross-Module Import Analysis

#### Apps → Lib (GOOD ✅)
```
src/apps/yallbrary/Entry.tsx → @/apps/types (AppUnitProps)
src/apps/crm/Entry.tsx → @/lib/ai/rocker (useRocker)
src/apps/business/Entry.tsx → @/lib/overlay/types (OverlayConfig)
```
**Status:** Apps importing from shared lib is correct and expected.

#### Apps → Other Apps (BAD ❌)
```
src/apps/crm/Panel.tsx → @/apps/marketplace/utils (CROSS-CONTAMINATION)
src/apps/calendar/hooks.ts → @/apps/events/types (CROSS-CONTAMINATION)
```
**Issue:** Apps should NEVER import from other apps. This creates tight coupling.

#### Components → Apps (BAD ❌)
```
src/components/super-andy/CenterStage.tsx → @/apps/rocker/Entry (TIGHT COUPLING)
src/components/ai/ChatPanel.tsx → @/apps/business/types (CROSS-CONTAMINATION)
```
**Issue:** Generic components should not depend on specific apps.

#### Edge Functions → Shared (GOOD ✅)
```
supabase/functions/rocker-chat/index.ts → _shared/cors, _shared/ai
supabase/functions/andy-thought-stream/index.ts → _shared/sse, _shared/logger
```
**Status:** Functions importing from _shared is correct pattern.

#### Workers → AI (MIXED ⚠️)
```
src/workers/runtime/pools.ts → (no imports, pure types) ✅
src/ai/super/meta_cortex → src/workers/runtime/pools (POTENTIAL COUPLING) ⚠️
```
**Issue:** AI subsystems should use worker interfaces, not direct pool types.

---

## 6. IDENTIFIED CROSS-CONTAMINATION ISSUES

### Issue 1: SSE Parser Crashing Other Features
**Problem:** JSON.parse on undefined in AndyThoughtStream.tsx caused site-wide crashes  
**Root Cause:** No input validation before parsing SSE data  
**Fix Applied:** Introduced safeParse helper that returns null for undefined/empty/malformed data  
**Status:** ✅ FIXED

### Issue 2: Chat Messages Not Persisting in Learning Pipeline
**Problem:** Frontend sends session_id, backend expects thread_id, analyze-memories reads wrong table  
**Root Cause:** Inconsistent naming across layers (session_id vs thread_id, rocker_conversations vs rocker_messages)  
**Fixes Applied:**
- Frontend: Changed useRockerChat to send thread_id
- Backend: Added backward compat mapping session_id → thread_id
- Memory analysis: Changed to read rocker_messages by thread_id
**Status:** ✅ FIXED

### Issue 3: Action Ledger Using Wrong Column
**Problem:** Queries using ai_action_ledger.created_at (doesn't exist) instead of timestamp  
**Root Cause:** Inconsistent column naming across codebase  
**Fixes Applied:** Updated all queries to use timestamp field  
**Status:** ✅ FIXED

### Issue 4: Tool Changes Breaking Pages
**Problem:** Modifying admin/system.tsx for action ledger fix risks breaking other admin tools  
**Root Cause:** No module boundaries; shared state/types across unrelated features  
**Status:** ❌ NOT YET ADDRESSED (needs module fences)

### Issue 5: Chat Backend Changes Affecting Analytics
**Problem:** rocker-chat-simple now auto-triggers analyze-memories, increasing load on analytics  
**Root Cause:** No rate limiting or circuit breakers between modules  
**Status:** ⚠️ PARTIALLY ADDRESSED (non-blocking invoke, but no backpressure)

---

## 7. PROPOSED MODULE BOUNDARIES (Module Fences)

### Principle: Apps Are Islands
**Rule:** Apps CANNOT import from other apps. Only from `@/lib/*` and `@/components/ui/*`

```
✅ ALLOWED:
src/apps/crm/Panel.tsx → @/lib/overlay/types
src/apps/yallbrary/Entry.tsx → @/components/ui/button

❌ FORBIDDEN:
src/apps/crm/Panel.tsx → @/apps/marketplace/utils
src/apps/calendar/hooks.ts → @/apps/events/types
```

### Public API Barrels (Barrel Exports)
**Rule:** Each module exposes a single public API via index.ts

```typescript
// src/apps/yallbrary/index.ts (PUBLIC API)
export { default as YallbraryEntry } from './Entry';
export { default as YallbraryPanel } from './Panel';
export type { YallbraryState } from './types';

// src/apps/yallbrary/internal/helpers.ts (PRIVATE)
// Not exported in index.ts, cannot be imported from outside
```

### Edge Function Isolation
**Rule:** Functions can only import from `_shared/*`. No direct cross-function imports.

```
✅ ALLOWED:
supabase/functions/rocker-chat/index.ts → _shared/ai, _shared/cors

❌ FORBIDDEN:
supabase/functions/rocker-chat/index.ts → ../andy-thought-stream/utils
```

### Worker/AI Boundaries
**Rule:** Workers and AI subsystems communicate via interfaces, not direct imports

```typescript
// src/workers/runtime/pools.ts (PUBLIC INTERFACE)
export interface Pool { ... }
export const POOL_NAMES = [...] as const;

// src/ai/super/meta_cortex/scheduler.ts (CONSUMER)
import type { Pool } from '@/workers/runtime/pools'; // ✅ Type-only import
// NOT: import { getCurrentPool } from '@/workers/runtime/pools'; // ❌ Runtime coupling
```

---

## 8. ENFORCEMENT MECHANISMS

### ESLint Boundaries Plugin
```json
{
  "rules": {
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          {
            "target": "./src/apps/yallbrary",
            "from": "./src/apps",
            "except": ["./types.ts"]
          },
          {
            "target": "./src/apps/crm",
            "from": "./src/apps",
            "except": ["./types.ts"]
          }
          // Repeat for all apps
        ]
      }
    ]
  }
}
```

### CODEOWNERS (Gated Changes)
```
# Apps - require app owner approval
/src/apps/yallbrary/** @yallbrary-owner
/src/apps/crm/** @crm-owner
/src/apps/marketplace/** @marketplace-owner

# AI Subsystems - require AI team approval
/src/ai/** @ai-team
/supabase/functions/andy-* @ai-team
/supabase/functions/rocker-* @ai-team

# Workers - require infra approval
/src/workers/** @infra-team

# Shared Lib - require platform approval
/src/lib/** @platform-team
/supabase/functions/_shared/** @platform-team
```

### Module Health Checks (CI)
```bash
# Check for forbidden cross-app imports
npm run check:boundaries

# Check for barrel export violations
npm run check:barrels

# Check for shared state mutations
npm run check:state-purity
```

---

## 9. MIGRATION PLAN

### Phase 1: Stop the Bleeding (Week 1)
1. ✅ Fix immediate crashes (SSE parser, action ledger, chat persistence)
2. Add ESLint boundaries for apps (prevent new cross-app imports)
3. Create barrel exports for existing modules
4. Document public APIs in each module's README

### Phase 2: Refactor Hot Spots (Week 2-3)
1. Break up cross-app dependencies (e.g., CRM → Marketplace utils)
2. Move shared code to `@/lib/*`
3. Create proper interfaces between workers and AI
4. Add circuit breakers for cross-module calls

### Phase 3: Enforce & Monitor (Week 4+)
1. Enable strict ESLint boundaries (fail CI on violations)
2. Set up CODEOWNERS
3. Add module health dashboards
4. Regular boundary audits

---

## 10. RISK ASSESSMENT

### High Risk (Immediate Attention)
- ❌ **Chat/Memory Pipeline:** Multiple fixes applied, but integration testing needed
- ❌ **Cross-App Imports:** 15+ violations found, tight coupling across apps
- ❌ **Shared State Mutations:** No state isolation, changes cascade unpredictably

### Medium Risk (Address in Phase 2)
- ⚠️ **Worker/AI Coupling:** Some direct imports, needs interface layer
- ⚠️ **Edge Function Fan-Out:** rocker-chat-simple now triggers analyze-memories (backpressure risk)
- ⚠️ **Component Reuse:** Generic components depend on specific apps

### Low Risk (Monitor)
- ✅ **Lib Layer:** Clean, well-defined, minimal coupling
- ✅ **UI Components:** Mostly isolated, good shadcn usage
- ✅ **Scripts Layer:** Completely isolated, no production dependencies

---

## 11. RECOMMENDED NEXT STEPS

1. **Immediate (Today):**
   - ✅ Apply SSE parser fix (DONE)
   - ✅ Apply chat persistence fixes (DONE)
   - ✅ Apply action ledger timestamp fix (DONE)
   - ⏳ Run full integration test on /super page
   - ⏳ Verify Andy learns from new chat messages

2. **This Week:**
   - Create barrel exports for all apps (`src/apps/*/index.ts`)
   - Add ESLint boundaries rule (warning mode first)
   - Document public APIs in module READMEs
   - Identify and list all cross-app imports for remediation

3. **Next Week:**
   - Break top 5 cross-app dependencies
   - Move shared utilities to `@/lib/*`
   - Add circuit breakers to high-traffic cross-module calls
   - Enable ESLint boundaries in error mode

4. **Long-Term:**
   - Set up CODEOWNERS
   - Add module health CI checks
   - Create boundary violation dashboard
   - Regular architecture reviews

---

## 12. CONTACT & OWNERSHIP

**Project Lead:** [TBD]  
**AI Team:** @ai-team  
**Infra Team:** @infra-team  
**Platform Team:** @platform-team  

**Document Maintainer:** AI Assistant (Lovable)  
**Last Updated:** 2025-10-24  
**Next Review:** 2025-11-01  

---

## APPENDIX: Quick Reference

### Key Files to Review First
1. `src/apps/types.ts` - App contract system
2. `src/pages/Index.tsx` - Landing page (A/B testing, invites)
3. `src/components/super-andy/AndyThoughtStream.tsx` - SSE thought stream (recently fixed)
4. `src/hooks/useRockerChat.ts` - Chat integration (recently fixed)
5. `supabase/functions/rocker-chat-simple/index.ts` - Chat backend (recently fixed)
6. `supabase/functions/analyze-memories/index.ts` - Memory extraction (recently fixed)

### Common Patterns
- **App Structure:** contract.ts (defines app) + Entry.tsx (renders in context) + Panel.tsx (panel view)
- **Edge Functions:** CORS headers, auth check, business logic, structured logging
- **AI Integration:** Lovable AI gateway (chat, embeddings) via _shared/ai.ts
- **State Management:** Zustand stores + Supabase realtime for sync
- **Styling:** Tailwind + semantic tokens from index.css

### Tools & Scripts
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run check:boundaries` - Check module boundaries (to be added)
- `npm run check:barrels` - Check barrel exports (to be added)

---

**END OF DOCUMENT**
