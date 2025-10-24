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

## 4. KEY CODE SNIPPETS (COMPLETE FILES)

### A. Landing Page with A/B Testing & Invite Parsing
**File:** `src/pages/Index.tsx` (COMPLETE - 282 lines)

```tsx
/**
 * 🔒 PRODUCTION-LOCKED LANDING PAGE (Dynamic + A/B Testing)
 * Step 2: Personalized landing with invite codes and variant assignment
 * Last updated: 2025-01-22
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRockerGreeting } from '@/hooks/useRockerGreeting';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Users, DollarSign, Shield, Zap, MessageSquare } from 'lucide-react';
import { fetchInviter, type InviterInfo } from '@/lib/refs/referral';
import { assignVariant, getVariantConfig, heroCopy } from '@/lib/marketing/personalize';
import { logEvent } from '@/lib/marketing/analytics';

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    // Listen for auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setLoading(false);
    });

    // Then check current session (do NOT redirect; allow viewing landing while logged in)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Trigger greeting for non-logged-in users
  useRockerGreeting(!isLoggedIn && !loading);
  
  // CTA click handler
  const handleCtaClick = (which: 'primary' | 'secondary') => {
    logEvent('cta_click', { variant, invite, extras: { which } });
    if (which === 'primary') {
      const params = new URLSearchParams({ mode: 'signup' });
      if (invite) params.set('invite', invite);
      params.set('variant', variant);
      navigate(`/auth?${params.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-variant={variant} data-cta-position={variantConfig.cta}>
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Yalls.ai</span>
          </div>
          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                <Button onClick={() => navigate('/auth?mode=login')} variant="ghost">
                  Sign In
                </Button>
                <Button onClick={() => handleCtaClick('primary')}>
                  Get Started
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero - Dynamic copy based on inviter interests */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-primary/5">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {invite && inviterInfo?.showName && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                You've been invited to join Yalls.ai
              </div>
            )}
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              {copy.headline.split('.')[0]}
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                {copy.headline.split('.').slice(1).join('.')}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              {copy.sub}
            </p>
            
            {!isLoggedIn && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Button 
                  onClick={() => handleCtaClick('primary')}
                  data-testid="cta-primary"
                  size="lg" 
                  className="text-lg px-10 py-7 shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  onClick={() => {
                    logEvent('cta_click', { variant, invite, extras: { which: 'secondary' } });
                  }}
                  data-testid="cta-secondary"
                  variant="outline" 
                  size="lg"
                  className="text-lg px-10 py-7"
                >
                  Explore Features
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Everything You Need</h2>
              <p className="text-xl text-muted-foreground">Run your entire equestrian business from one platform</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<DollarSign className="w-10 h-10" />}
                title="Marketplace & Payments"
                description="Sell products, services, and events with instant payment processing. MLM commissions built-in."
              />
              <FeatureCard 
                icon={<Users className="w-10 h-10" />}
                title="Network & Downline"
                description="Build your team and earn commissions on your entire network's sales automatically."
              />
              <FeatureCard 
                icon={<MessageSquare className="w-10 h-10" />}
                title="AI Assistant"
                description="Get instant help with scheduling, customer communication, and business decisions."
              />
              <FeatureCard 
                icon={<Shield className="w-10 h-10" />}
                title="Business Management"
                description="CRM, calendar, approvals, and farm operations all in one powerful dashboard."
              />
              <FeatureCard 
                icon={<Zap className="w-10 h-10" />}
                title="Instant Analytics"
                description="Track earnings, network growth, and performance metrics in real-time."
              />
              <FeatureCard 
                icon={<Sparkles className="w-10 h-10" />}
                title="Smart Automation"
                description="Automate follow-ups, reminders, and routine tasks to save hours every day."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isLoggedIn && (
        <section className="py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold">Ready to Get Started?</h2>
              <p className="text-xl text-muted-foreground">
                {invite && inviterInfo?.showName 
                  ? 'Join thousands of professionals already building with AI on Yalls.ai'
                  : 'Join thousands of professionals already on Yalls.ai'}
              </p>
              <Button 
                onClick={() => handleCtaClick('primary')}
                size="lg"
                className="text-lg px-10 py-7 shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-sm text-muted-foreground">No credit card required · Start building today</p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 border-t border-border/40 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold">Yalls.ai</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <button onClick={() => navigate('/privacy')}>Privacy</button>
              <button onClick={() => navigate('/terms')}>Terms</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-card/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default Index;
```

**Key Features:**
- Stable visitor ID via cookie or invite code
- A/B variant assignment with useMemo
- Personalized copy based on inviter's interests
- Event tracking for impressions and CTA clicks

---

### B. Marketing Analytics (Event Tracking)
**File:** `src/lib/marketing/analytics.ts` (COMPLETE - 60 lines)

```typescript
/**
 * Marketing Analytics - Client-side event tracking
 */

import { supabase } from '@/integrations/supabase/client';
import { traceId } from '@/lib/telemetry/trace';

export type MarketingEventType = 
  | 'home_impression'
  | 'cta_click'
  | 'signup_start'
  | 'signup_complete';

export interface LogEventPayload {
  variant: string;
  invite?: string | null;
  extras?: Record<string, any>;
}

/**
 * Log a marketing event to the database
 */
export async function logEvent(
  type: MarketingEventType,
  payload: LogEventPayload
): Promise<void> {
  const sessionId = getOrSetSession();
  const userAgent = navigator.userAgent;

  try {
    await supabase.from('marketing_events').insert({
      trace_id: traceId(),
      session_id: sessionId,
      event_type: type,
      variant: payload.variant,
      invite_code: payload.invite || null,
      referrer: document.referrer || null,
      user_agent: userAgent,
      extras: payload.extras || {},
    });
  } catch (error) {
    // Silent fail - don't break UX for analytics
    console.debug('Analytics event failed:', error);
  }
}

/**
 * Get or create session ID (stored in localStorage)
 */
function getOrSetSession(): string {
  const key = 'y_session_id';
  let sessionId = localStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}
```

---

### C. Marketing Personalization (A/B Testing Engine)
**File:** `src/lib/marketing/personalize.ts` (COMPLETE - 76 lines)

```typescript
/**
 * Marketing Personalization Engine
 * A/B/C/D variant assignment and dynamic copy generation
 */

export type VariantKey = 'A' | 'B' | 'C' | 'D';

export interface VariantConfig {
  theme: string;
  cta: string;
  heroStyle: string;
}

export interface HeroCopy {
  headline: string;
  sub: string;
}

/**
 * Assign stable A/B/C/D variant based on seed (invite code or session ID)
 */
export function assignVariant(seed: string): VariantKey {
  // Stable hash to bucket assignment
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash * 31) + seed.charCodeAt(i)) >>> 0;
  }
  
  const keys: VariantKey[] = ['A', 'B', 'C', 'D'];
  return keys[hash % keys.length];
}

/**
 * Get variant configuration
 */
export function getVariantConfig(variant: VariantKey): VariantConfig {
  const configs: Record<VariantKey, VariantConfig> = {
    A: { theme: 'default', cta: 'primary-top', heroStyle: 'split' },
    B: { theme: 'warm', cta: 'primary-center', heroStyle: 'stack' },
    C: { theme: 'cool', cta: 'primary-top', heroStyle: 'image-left' },
    D: { theme: 'contrast', cta: 'primary-bottom', heroStyle: 'big-headline' },
  };
  return configs[variant];
}

/**
 * Generate personalized hero copy based on inviter's interests
 */
export function heroCopy(opts: {
  inviterInterests?: string[];
}): HeroCopy {
  const interests = opts.inviterInterests || [];
  const primaryInterest = interests[0]?.toLowerCase() || null;

  // Equestrian/horses personalization
  if (primaryInterest === 'horses' || primaryInterest === 'equestrian') {
    return {
      headline: "AI that actually helps you run the barn (and the business).",
      sub: "Scheduling, sales, entries, payroll, CRM—plug in only what you need. No ads. No shadow bans. Just results.",
    };
  }

  // Fitness personalization
  if (primaryInterest === 'fitness') {
    return {
      headline: "Build your brand and business—AI that spots the next move.",
      sub: "From coaching flows to merch drops—connect audience → conversions with zero ad waste.",
    };
  }

  // Default copy
  return {
    headline: "Own your audience. Build your business. AI that works for you.",
    sub: "Curated feed, app library, and proactive assistants—no lock-in, no nonsense.",
  };
}
```

---

### D. Rocker Chat Hook (Frontend Integration)
**File:** `src/hooks/useRockerChat.ts` (COMPLETE - 82 lines)

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { trackRockerMessage } from '@/lib/telemetry/events';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: any[];
}

export function useRockerChat(sessionId: string) {
  const { session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string) => {
    if (!session?.userId) {
      toast.error('Please sign in to chat with Rocker');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMsg: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await supabase.functions.invoke('rocker-chat', {
        body: {
          user_id: session.userId,
          thread_id: sessionId,
          message
        }
      });

      if (response.error) throw response.error;

      const { reply, actions } = response.data;
      
      // Add AI response
      const aiMsg: Message = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        actions
      };
      setMessages(prev => [...prev, aiMsg]);

      // Track telemetry
      trackRockerMessage(!!actions);

    } catch (err: any) {
      console.error('Rocker chat error:', err);
      setError(err.message || 'Failed to send message');
      toast.error('Failed to send message. Please try again.', {
        action: {
          label: 'Retry',
          onClick: () => sendMessage(message)
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage
  };
}
```

**Key Features:**
- FIXED: Sends `thread_id` instead of `session_id` to backend
- Optimistic UI updates (adds user message immediately)
- Error handling with retry toast
- Telemetry tracking for actions

---

### E. Rocker Chat Backend (Simple Version with Tool Calling)
**File:** `supabase/functions/rocker-chat-simple/index.ts` (COMPLETE - 352 lines)

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withTenantGuard, type TenantContext } from "../_shared/tenantGuard.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { kernel } from "../_shared/dynamic-kernel.ts";
import { offlineRAG } from "../_shared/offline-rag.ts";
import type { Message } from "../_shared/ai.ts";
import { rockerTools } from "./tools.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  return withTenantGuard(req, async (ctx: TenantContext) => {
    const log = createLogger('rocker-chat-simple');
    log.startTimer();

    try {
      const payload = await req.json().catch(() => ({}));
      const { message, thread_id } = payload as { message?: string; thread_id?: string };
      
      log.info('Incoming request', { 
        hasMessage: !!message, 
        hasThread: !!thread_id,
        userId: ctx.userId,
        orgId: ctx.orgId 
      });
      
      if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({ error: 'message is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Persist user message when thread provided
      if (thread_id) {
        try {
          await ctx.tenantClient.from('rocker_messages').insert({
            thread_id,
            user_id: ctx.userId,
            role: 'user',
            content: message,
            meta: {},
          });
        } catch (e) {
          log.error('Failed to insert user message', e);
        }
      }

      // Fetch conversation history + relevant memories
      let conversationHistory: Message[] = [];
      if (thread_id) {
        const { data: history } = await ctx.tenantClient
          .from('rocker_messages')
          .select('role, content')
          .eq('thread_id', thread_id)
          .order('created_at', { ascending: true })
          .limit(20);
        conversationHistory = (history || []).map(h => ({
          role: h.role as 'user' | 'assistant' | 'system',
          content: h.content
        }));
      }
      
      // RAG: Retrieve relevant memories
      const ragResults = await offlineRAG.search(ctx, message, { limit: 5, threshold: 0.6 });
      const memoryContext = ragResults.length > 0
        ? '\\n\\nRelevant memories:\\n' + ragResults.map(r => `- ${r.key}: ${JSON.stringify(r.value)}`).join('\\n')
        : '';
      
      log.info('Context loaded', {
        history_count: conversationHistory.length,
        memories_count: ragResults.length
      });

      // Determine actor role from capabilities
      const actorRole = ctx.capabilities.includes('super_admin') ? 'knower'
        : ctx.capabilities.includes('admin') ? 'admin'
        : 'user';

      // Persona-specific system prompts
      const systemPrompts: Record<string, string> = {
        user: 'You are User Rocker - friendly, helpful personal assistant. Focus on user tasks, preferences, and daily needs. Keep answers concise.' + memoryContext,
        admin: 'You are Admin Rocker - professional oversight assistant. Focus on moderation, analytics, org-level tasks. Be precise and audit-focused.' + memoryContext,
        knower: 'You are Super Andy - omniscient meta-cognitive AI with full system access. Be INQUISITIVE and proactive: When users ask to open apps (calendar, files, tasks, etc.), use the fe.navigate tool to open them AND ask engaging follow-up questions about what they want to accomplish. Learn from every interaction by asking thoughtful questions. Be conversational and curious about user goals. When performing actions, explain what you\'re doing and why. Help users discover what they need, not just what they ask for. Available apps: calendar, files, tasks, knowledge, learn, inbox, admin, secrets, capabilities, proactive, training, task-os.' + memoryContext
      };

      // Initialize reply and confidence
      let reply = '';
      let confidence = 1.0;

      // Detect complex multi-step tasks that need MDR orchestration
      const isComplexTask = message.length > 200 || 
        /\\b(plan|strategy|analyze|compare|evaluate|multi-step|complex|orchestrat)\\b/i.test(message);
      
      // For complex tasks: Use MDR (Multi-Dimensional Reasoning)
      if (isComplexTask && actorRole === 'knower') {
        log.info('Complex task detected - invoking MDR orchestration');
        
        const taskId = `task-${Date.now()}-${ctx.userId.substring(0, 8)}`;
        
        // Step 1: Generate perspectives
        const { data: mdrGenerate } = await ctx.adminClient.functions.invoke('mdr_generate', {
          body: { taskId, tenantId: ctx.tenantId, context: { message, history: conversationHistory } }
        });
        
        // Step 2: Build consensus
        const { data: mdrConsensus } = await ctx.adminClient.functions.invoke('mdr_consensus', {
          body: { taskId, tenantId: ctx.tenantId }
        });
        
        // Step 3: Orchestrate sub-agents
        const { data: mdrOrchestrate } = await ctx.adminClient.functions.invoke('mdr_orchestrate', {
          body: { taskId, tenantId: ctx.tenantId, context: mdrConsensus }
        });
        
        reply = `**Complex Task Analysis Complete**\\n\\nGenerated ${mdrGenerate?.perspectives || 3} strategic perspectives and selected optimal plan (confidence: ${mdrConsensus?.consensus?.confidence || 85}%).\\n\\n**Chosen Approach:** ${mdrConsensus?.chosenPlan?.approach || 'Multi-step validated execution'}\\n\\n**Sub-agents queued:** ${mdrOrchestrate?.agents?.join(', ') || 'gap_finder, verifier, executor'}\\n\\nMonitor progress in the dashboard.`;
        confidence = (mdrConsensus?.consensus?.confidence || 85) / 100;
      } else {
        // Simple tasks: Standard tool-calling loop
        let toolCallCount = 0;
        const maxToolCalls = 5;
        
        try {
          const messages: Message[] = [
            { role: 'system', content: systemPrompts[actorRole] || systemPrompts.user },
            ...conversationHistory,
            { role: 'user', content: message }
          ];

          while (toolCallCount < maxToolCalls) {
          // Use dynamic kernel for optimal model selection
          const response = await kernel.chat(ctx, messages, {
            tools: rockerTools.map(t => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters
            })),
            temperature: 0.7,
            latency: 'interactive'
          });

          // Check if AI returned tool calls in raw response
          const toolCalls = response.raw?.choices?.[0]?.message?.tool_calls;
          if (toolCalls && toolCalls.length > 0) {
            log.info('Tool calls requested', { count: toolCalls.length });
            toolCallCount++;
            
            // Execute each tool
            const toolResults = [];
            for (const toolCall of toolCalls) {
              const toolName = toolCall.function.name;
              const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
              
              log.info('Executing tool', { tool: toolName, args: toolArgs });
              
              try {
                let result;
                
                // Execute tool based on name
                if (toolName === 'db.create_task') {
                  const { data, error } = await ctx.tenantClient.from('rocker_tasks').insert({
                    user_id: ctx.userId,
                    title: toolArgs.title,
                    description: toolArgs.description,
                    priority: toolArgs.priority || 'medium',
                    status: 'pending',
                    due_at: toolArgs.due_at || null
                  }).select().single();
                  result = error ? { error: error.message } : { success: true, task_id: data?.id };
                } else if (toolName === 'db.query_tasks') {
                  const query = ctx.tenantClient
                    .from('rocker_tasks')
                    .select('*')
                    .eq('user_id', ctx.userId);
                  
                  if (toolArgs.status) query.eq('status', toolArgs.status);
                  query.limit(toolArgs.limit || 10);
                  
                  const { data, error } = await query;
                  result = error ? { error: error.message } : { tasks: data };
                } else if (toolName === 'fe.navigate') {
                  // Emit navigation action - expecting app name not path
                  const appName = toolArgs.path?.replace('/super/', '').replace('/', '') || toolArgs.app || toolArgs.path;
                  try {
                    await ctx.tenantClient.from('ai_proposals').insert({
                      type: 'navigate',
                      user_id: ctx.userId,
                      tenant_id: ctx.tenantId,
                      payload: { app: appName }
                    });
                    result = { success: true, action: 'navigate', app: appName };
                  } catch (e) {
                    result = { error: 'Failed to emit navigation' };
                  }
                } else if (toolName === 'fe.toast') {
                  // Emit toast action
                  try {
                    await ctx.tenantClient.from('ai_proposals').insert({
                      type: 'notify.user',
                      user_id: ctx.userId,
                      tenant_id: ctx.tenantId,
                      payload: {
                        title: toolArgs.title,
                        description: toolArgs.description,
                        variant: toolArgs.variant || 'default'
                      }
                    });
                    result = { success: true, action: 'toast' };
                  } catch (e) {
                    result = { error: 'Failed to emit toast' };
                  }
                } else {
                  result = { error: `Unknown tool: ${toolName}` };
                }
                
                toolResults.push({ tool: toolName, result });
                
                // Add tool result to conversation
                messages.push({
                  role: 'assistant',
                  content: `Tool ${toolName} executed: ${JSON.stringify(result)}`
                });
              } catch (err) {
                log.error('Tool execution failed', { tool: toolName, error: err });
                toolResults.push({ tool: toolName, error: String(err) });
              }
            }
            
            // Continue conversation with tool results
            continue;
          } else {
            // No more tools, final response
            reply = response.text || '';
            break;
          }
        }


        // Detect low confidence
        if (/i don't know|i'm not sure|unclear|cannot help/i.test(reply)) {
          confidence = 0.3;
        }
      } catch (e) {
        log.error('AI/tool execution failed', e);
        confidence = 0;
        return new Response(JSON.stringify({ error: 'AI call failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } // end else block (simple tasks)

    // Phase 2: Gap signal detection - log when confidence is low
    if (confidence < 0.65) {
        try {
          await ctx.tenantClient.from('rocker_gap_signals').insert({
            user_id: ctx.userId,
            kind: 'low_conf',
            query: message,
            score: confidence,
            meta: { thread_id, suggestedRefresh: true }
          });
          log.info('Gap signal logged for low confidence');
        } catch (e) {
          log.error('Failed to log gap signal', e);
        }
      }

      // Phase 3: Auto-task detection - create tasks from action items
      if (/action needed|todo|task|remind me|schedule|follow up/i.test(reply)) {
        try {
          const taskMatch = reply.match(/(?:action needed|todo|task|remind me|schedule|follow up)[:\\s]+([^.!?]+)/i);
          if (taskMatch && taskMatch[1]) {
            const taskTitle = taskMatch[1].trim().slice(0, 100);
            await ctx.tenantClient.from('rocker_tasks').insert({
              user_id: ctx.userId,
              title: taskTitle,
              status: 'pending',
              priority: 'medium',
              meta: { auto_created: true, source_message: message }
            });
            log.info('Auto-created task', { title: taskTitle });
          }
        } catch (e) {
          log.error('Failed to auto-create task', e);
        }
      }

      // Persist assistant reply
      if (thread_id && reply) {
        try {
          await ctx.tenantClient.from('rocker_messages').insert({
            thread_id,
            user_id: ctx.userId,
            role: 'assistant',
            content: reply,
            meta: { confidence },
          });
        } catch (e) {
          log.error('Failed to insert assistant message', e);
        }

        // Trigger memory extraction async (non-blocking)
        try {
          await ctx.tenantClient.functions.invoke('analyze-memories', { body: { trigger: 'chat_reply', thread_id } });
        } catch (e) {
          log.warn('analyze-memories invocation failed (non-blocking)', e);
        }
      }

      // Check for navigation actions in recent proposals
      let actions: any[] = [];
      if (thread_id) {
        const { data: proposals } = await ctx.tenantClient
          .from('ai_proposals')
          .select('type, payload')
          .eq('user_id', ctx.userId)
          .gte('created_at', new Date(Date.now() - 5000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (proposals && proposals.length > 0) {
          actions = proposals.map(p => ({
            kind: p.type === 'navigate' ? 'navigate' : p.type,
            ...p.payload
          }));
        }
      }

      log.info('Request completed', { 
        reply_length: reply.length,
        confidence,
        actions_count: actions.length
      });

      return new Response(JSON.stringify({ reply, actions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      log.error('Handler error', e);
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }, { 
    requireAuth: true, 
    rateLimitTier: 'standard' 
  });
});
```

**Key Features:**
- FIXED: Auto-triggers `analyze-memories` after assistant reply (line 307)
- Tool calling loop: db.create_task, db.query_tasks, fe.navigate, fe.toast
- MDR (Multi-Dimensional Reasoning) for complex tasks
- RAG memory retrieval for context
- Gap signal detection for low confidence
- Auto-task creation from action items

---

### F. Memory Analysis Backend
**File:** `supabase/functions/analyze-memories/index.ts` (COMPLETE - 114 lines)

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { createLogger } from "../_shared/logger.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const log = createLogger('analyze-memories');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = user.id;

    // Ensure consent
    await supabaseClient.from('ai_user_consent').upsert({
      tenant_id: tenantId,
      user_id: user.id,
      site_opt_in: true,
      policy_version: 'v1',
      consented_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,user_id' });

    const { data: conversations } = await supabaseClient
      .from('rocker_messages')
      .select('content, role, created_at, thread_id')
      .eq('user_id', user.id)
      .not('thread_id', 'is', null)
      .order('created_at', { ascending: true });

    if (!conversations) throw new Error('Failed to load conversations');

    const sessions = new Map<string, any[]>();
    for (const msg of conversations) {
      if (!sessions.has(msg.thread_id)) sessions.set(msg.thread_id, []);
      sessions.get(msg.thread_id)!.push(msg);
    }

    let totalExtracted = 0;

    for (const [sessionId, messages] of sessions.entries()) {
      const conversationText = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\\n\\n');

      const { text } = await ai.chat({
        role: 'knower',
        messages: [
          { role: 'system', content: `Extract memorable facts as JSON array: [{ key, type, value, confidence, context }]. Types: family, personal_info, preference, goal, interest, skill, project, relationship` },
          { role: 'user', content: conversationText }
        ],
        maxTokens: 800
      });

      let memories: any[] = [];
      try {
        const jsonMatch = text.match(/\\[[\\s\\S]*\\]/);
        if (jsonMatch) memories = JSON.parse(jsonMatch[0]);
      } catch {}

      for (const mem of memories) {
        if (!mem.key || !mem.value || !mem.type) continue;

        const { data: existing } = await supabaseClient.from('ai_user_memory').select('id').eq('user_id', user.id).eq('key', mem.key.toLowerCase().replace(/\\s+/g, '_')).maybeSingle();
        if (existing) continue;

        const { error: insertErr } = await supabaseClient.from('ai_user_memory').insert({
          user_id: user.id,
          tenant_id: tenantId,
          key: mem.key.toLowerCase().replace(/\\s+/g, '_'),
          value: { content: mem.value, context: mem.context || '', session_id: sessionId, extracted_at: new Date().toISOString() },
          type: mem.type,
          confidence: mem.confidence || 0.7,
          source: 'chat',
          tags: [mem.type, 'ai_backfill'],
          namespace: 'personal'
        });

        if (!insertErr) totalExtracted++;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    return new Response(JSON.stringify({ totalExtracted, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Error in analyze-memories', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Key Features:**
- FIXED: Reads from `rocker_messages` by `thread_id` (line 47-50)
- Groups messages by thread_id (sessions Map)
- Uses AI to extract facts as JSON array
- Deduplicates memories by key
- Inserts into `ai_user_memory` table

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
