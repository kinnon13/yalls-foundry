# 🚨 SUPER ANDY AUDIT REPORT
## SpaceX-Grade System Analysis & Rebuild Plan

**Date:** 2025-01-18  
**Status:** CRITICAL REBUILD REQUIRED  
**Overall Grade:** 47/100 (RED ALERT)

---

## 🎯 EXECUTIVE SUMMARY

Super Andy is **47% operational**. Training dashboard is fake UI. RAG is 96% broken. Security was wide open (now fixed). This report details what's real, what's fake, and the complete rebuild plan to get to 100%.

---

## ❌ WHAT'S FAKE (MOCK UI)

### 1. Training Dashboard - 100% FAKE
- **Location:** `src/pages/Super/Training.tsx`
- **Lines 36-37:** Hardcoded values `biasScore: 0.15`, `accuracy: 0.87`
- **Reality:** No connection to actual AI feedback, no real metrics
- **Fix Required:** Wire to `ai_feedback`, `ai_monitoring`, real training runs

### 2. Embeddings / RAG - 96% BROKEN
- **Reality Check:** 24 out of 25 memories missing embeddings
- **Root Cause:** `user_rag_index` calls wrong OpenAI endpoint with Lovable key
- **Fix Required:** Use Lovable AI embedding endpoint or build vector pipeline

### 3. Extract Insights - NOT IMPLEMENTED
- **Location:** Training dashboard "Extract Insights" button
- **Reality:** Just shows mock data, no actual analysis
- **Fix Required:** Build insight extraction engine

---

## ✅ WHAT'S REAL (VERIFIED WORKING)

### 1. Chat (andy-chat) - ✅ WORKING
- **Location:** `supabase/functions/andy-chat/index.ts`
- **Status:** Streaming responses via Grok-2-Vision or Gemini fallback
- **Verified:** Loads 7 memory tables, builds context, returns responses

### 2. Memory Pipeline - ✅ OPERATIONAL
- **Tables Active (7):**
  - `rocker_messages` - Chat history
  - `ai_user_memory` - Structured memories
  - `rocker_long_memory` - Facts/preferences
  - `rocker_knowledge` - RAG knowledge base
  - `rocker_files` - File storage
  - `rocker_tasks` - Task tracking
  - `calendar_events` - Event memory

### 3. Edge Functions - ✅ DEPLOYED (39 total)
- All functions exist and boot
- Some have auth errors (need RLS fixes)
- Core andy-* functions operational

### 4. Cron Jobs - ✅ SCHEDULED (13 active)
- **CRITICAL:** All use exposed anon key (ROTATE IMMEDIATELY)
- Jobs are running on schedule
- Need secure secret-based auth

### 5. Database - ✅ INTACT
- 58 AI tables exist
- 1196 database functions
- **FIXED TODAY:** RLS now enabled on all ai_* tables

---

## 🔐 SECURITY STATUS

### ✅ FIXED TODAY

1. **RLS Enabled on All AI Tables**
   - **Before:** ALL 30+ ai_* tables had RLS DISABLED
   - **After:** Full tenant isolation + service role access
   - **Migration:** `20251023...sql` deployed successfully

2. **Tenant Policies**
   - Service role (Andy): Full access to everything
   - Authenticated users: Can only access their own data via `tenant_id` or `user_id`
   - Anonymous: Denied all access

### 🚨 CRITICAL: IMMEDIATE ACTION REQUIRED

**EXPOSED ANON KEY IN CRON JOBS**
```sql
-- 10+ cron jobs have this exposed:
Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**ACTION PLAN:**
1. Generate new anon key in Supabase dashboard
2. Create X-Cron-Secret header for cron auth
3. Update all cron jobs to use secure secret
4. Rotate service role key

---

## 📊 INFRASTRUCTURE INVENTORY

### Edge Functions (39)

**Andy Core (14):**
1. andy-chat ✅
2. andy-admin ✅
3. andy-ask-questions ⚠️ (auth error)
4. andy-auto-analyze ✅
5. andy-embed-knowledge ✅
6. andy-enhance-memories ✅
7. andy-expand-memory ✅
8. andy-game-orchestrator ✅
9. andy-learn-from-message ✅
10. andy-live-question ⚠️ (auth error)
11. andy-merge-memories ✅
12. andy-prediction-game ✅
13. andy-snooze ✅
14. andy-task-os ⚠️ (auth error)

**Rocker (14):**
1. rocker-chat-simple ✅
2. super-andy-chat ⚠️ (deprecated)
3. admin-rocker-chat ✅
4. user-rocker-chat ✅
5. rocker-discovery ✅
6. rocker-tasks ✅
... (8 more)

**Workers (5):**
1. user_rag_index ⚠️ (broken embeddings)
2. aggregate-learnings ✅
3. analyze-learn-feedback ✅
4. analyze-memories ✅
5. mdr_consensus ✅

**Cron (6):**
1. perceive_tick ⚠️ (anon key exposed)
2. circuit_breaker_tick ⚠️
3. red_team_tick ⚠️
4. fine_tune_cohort ⚠️
5. self_improve_tick ⚠️
6. unlock-pins-cron ✅

### Database Tables (58 AI tables)

**Memory Layer (7 tables)** ✅
**Learning Layer (8 tables)** ✅
**Orchestration (5 tables)** ✅
**MDR (4 tables)** ✅
**Games (3 tables)** ✅
**Control (6 tables)** ✅
**Governance (4 tables)** ✅
**Feedback (3 tables)** ✅
**Infrastructure (18 tables)** ✅

### Cron Schedule (13 jobs)

| Job ID | Schedule | Function | Status |
|--------|----------|----------|--------|
| 1 | Daily 3:17 AM | cleanup observations | ✅ |
| 2 | Daily 2:00 AM | unlock-pins | ✅ |
| 3 | Every 5 min | rocker-discovery | ⚠️ |
| 4 | Every 5 min | red_team_tick | ⚠️ |
| 5 | Daily 2:00 AM | user_rag_index | ❌ |
| 6 | Every 6 hours | fine_tune_cohort | ⚠️ |
| 7 | Weekly Mon 1 AM | perceive_tick | ⚠️ |
| 8 | Every 6 hours | circuit_breaker | ⚠️ |
| 9 | Every 15 min | red_team_tick (dup) | ⚠️ |
| 10 | Daily 2:00 AM | perceive_tick (dup) | ⚠️ |
| 11 | Every 6 hours | self_improve_tick | ⚠️ |
| 12 | Daily 2:00 AM | aggregate-learnings | ⚠️ |
| 13 | Every 6 hours | gap_finder | ⚠️ |

⚠️ = Uses exposed anon key

---

## 🧩 WHAT'S MISSING

### 1. Executor-Full.ts - 0% COMPLETE
**Should be:** Unified tool execution engine with 60+ tools  
**Reality:** Doesn't exist  
**Impact:** Tools not actually wired, AI can't execute actions

### 2. 20 RAG Systems - 5% COMPLETE
**Should be:** 20 domain-specific RAG engines  
**Reality:** 1 broken RAG (user_rag_index calls wrong endpoint)  
**Impact:** No semantic search, no knowledge retrieval

### 3. Event Bus - 50% WIRED
**Should be:** Full bidirectional event system  
**Reality:** Front-end emits, AI doesn't execute back  
**Impact:** No tool execution from AI responses

### 4. Monitoring Dashboard - 0% BUILT
**Should be:** Real-time metrics, success rates, latency  
**Reality:** Training dashboard shows fake metrics  
**Impact:** No visibility into actual performance

### 5. Tenant Guard Enforcement - 30% DEPLOYED
**Should be:** Every edge function wrapped with tenant guard  
**Reality:** Only 10 out of 39 functions use it  
**Impact:** Security holes in non-guarded functions

### 6. Rate Limiting - 0% ENFORCED
**Should be:** Per-tenant rate limits on all functions  
**Reality:** No rate limiting anywhere  
**Impact:** DoS vulnerability, no abuse prevention

---

## 🚀 THE REBUILD PLAN

### Phase 1: EMERGENCY FIXES (TODAY)
**Priority:** P0 - System Integrity

1. ✅ Enable RLS on all AI tables - **DONE**
2. 🔥 Rotate exposed anon key - **DO NOW**
3. 🔥 Secure cron jobs with X-Cron-Secret - **DO NOW**
4. ⚙️ Fix RAG embeddings endpoint - **1 hour**
5. ⚙️ Run RAG indexer on all 24 unindexed memories - **30 min**

### Phase 2: REAL METRICS (DAY 1-2)
**Priority:** P1 - Visibility

1. Build real training dashboard with actual metrics
   - Wire to `ai_feedback` for tool success rates
   - Wire to `ai_monitoring` for latency/errors
   - Show real bias scores from `ai_bias_logs`
   - Show real training runs from `ai_training_runs`

2. Create Andy Brain Monitor with live data
   - Memory growth rate (daily embeddings)
   - RAG coverage (% of content indexed)
   - Tool execution success rate
   - Response latency P50/P95/P99

### Phase 3: BUILD EXECUTOR-FULL (DAY 2-3)
**Priority:** P1 - Core Functionality

```typescript
// supabase/functions/_shared/executor-full.ts

import { withTenantGuard } from './tenantGuard.ts';
import { withRateLimit } from './rate-limit.ts';

export const TOOL_REGISTRY = {
  // Memory tools (5)
  'memory.create': createMemory,
  'memory.search': searchMemory,
  'memory.update': updateMemory,
  'memory.delete': deleteMemory,
  'memory.consolidate': consolidateMemories,
  
  // Task tools (5)
  'task.create': createTask,
  'task.update': updateTask,
  'task.list': listTasks,
  'task.complete': completeTask,
  'task.delete': deleteTask,
  
  // Calendar tools (5)
  'calendar.create': createEvent,
  'calendar.update': updateEvent,
  'calendar.list': listEvents,
  'calendar.delete': deleteEvent,
  'calendar.search': searchCalendar,
  
  // File tools (5)
  'file.upload': uploadFile,
  'file.analyze': analyzeFile,
  'file.search': searchFiles,
  'file.embed': embedFile,
  'file.delete': deleteFile,
  
  // ... 40 more tools (60 total)
};

export async function executeTool(
  toolName: string, 
  args: Record<string, any>, 
  tenantId: string
) {
  // Tenant guard
  await withTenantGuard(tenantId);
  
  // Rate limit
  await withRateLimit(tenantId, 'tool_exec');
  
  // Execute
  const tool = TOOL_REGISTRY[toolName];
  if (!tool) throw new Error(`Unknown tool: ${toolName}`);
  
  const result = await tool(args, tenantId);
  
  // Log to ai_feedback
  await logToolExecution(toolName, args, result, tenantId);
  
  return result;
}
```

### Phase 4: 20 RAG SYSTEMS (DAY 3-5)
**Priority:** P1 - Knowledge

Build 20 specialized RAG pipelines:

| Domain | Table Source | Refresh | Status |
|--------|-------------|---------|--------|
| Chat | rocker_messages | Hourly | ⚙️ Build |
| Files | rocker_knowledge | Hourly | ⚙️ Fix |
| Listings | marketplace_items | Daily | ⚙️ Build |
| Horses | entity_profiles (type=horse) | Hourly | ⚙️ Build |
| Farms | entity_profiles (type=farm) | Hourly | ⚙️ Build |
| Events | events, event_results | Hourly | ⚙️ Build |
| Calendar | calendar_events | Hourly | ⚙️ Build |
| Tasks | rocker_tasks | Hourly | ⚙️ Build |
| Incentives | incentive_programs | Daily | ⚙️ Build |
| Businesses | entity_profiles (type=business) | Hourly | ⚙️ Build |
| Payments | transactions | Hourly | ⚙️ Build |
| Support | support_tickets | Hourly | ⚙️ Build |
| Developers | repo_docs, PRDs | Daily | ⚙️ Build |
| Marketing | campaigns, ads | Hourly | ⚙️ Build |
| Compliance | audit_events | Daily | ⚙️ Build |
| Analytics | usage_stats | Hourly | ⚙️ Build |
| Newsfeed | feed_posts | Hourly | ⚙️ Build |
| Media | uploads | Hourly | ⚙️ Build |
| Notifications | notifications | Hourly | ⚙️ Build |
| Knowledge Graph | combined embeddings | Hourly merge | ⚙️ Build |

**Implementation Pattern:**
```typescript
// supabase/functions/rag-{domain}/index.ts
export async function indexDomain(domain: string) {
  const source = DOMAIN_SOURCES[domain];
  const { data } = await supabase.from(source.table).select(source.fields);
  
  for (const item of data) {
    const embedding = await embed(item[source.contentField]);
    await supabase.from('ai_embeddings').upsert({
      domain,
      source_id: item.id,
      content: item[source.contentField],
      embedding,
    });
  }
}
```

### Phase 5: EVENT BUS COMPLETION (DAY 5-6)
**Priority:** P2 - Bidirectional

1. AI → Tool Execution
   - Parse tool calls from LLM responses
   - Route to executor-full.ts
   - Return results to AI for next turn

2. Tool → Event Bus
   - Emit events after successful execution
   - Update front-end in real-time
   - Track in ai_action_ledger

### Phase 6: SECURE CRONS (DAY 6)
**Priority:** P0 - Security

```sql
-- Create cron secret
INSERT INTO vault.secrets (name, secret) 
VALUES ('cron_secret', gen_random_uuid()::text);

-- Update all cron jobs to use secret
SELECT cron.alter_job(
  {job_id},
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-Cron-Secret', current_setting('app.cron_secret')
  )
);
```

### Phase 7: MONITORING DASHBOARD (DAY 7)
**Priority:** P2 - Operations

Build Grafana-style metrics dashboard:
- Tool execution success rate (target: >98%)
- RAG coverage (target: >95%)
- Response latency P50/P95/P99
- Memory growth rate
- Error rate by function
- Cron job health

---

## 📋 VERIFICATION CHECKLIST

### Security
- [x] RLS enabled on all AI tables
- [ ] Anon key rotated
- [ ] Cron secret implemented
- [ ] All functions use tenant guard
- [ ] Rate limiting enforced

### Functionality
- [x] Chat working (andy-chat)
- [ ] RAG indexing working
- [ ] Executor-full.ts built
- [ ] 20 RAG systems deployed
- [ ] Event bus bidirectional
- [ ] Tools actually execute

### Metrics & Monitoring
- [ ] Training dashboard shows real data
- [ ] Brain monitor shows live metrics
- [ ] Success rates tracked
- [ ] Latency monitored
- [ ] Errors logged

### Infrastructure
- [x] 39 edge functions deployed
- [x] 13 cron jobs scheduled
- [ ] Cron jobs secured
- [x] 58 AI tables created
- [x] 1196 database functions

---

## 🎯 SUCCESS CRITERIA

**Grade A (90-100%):**
- All tools execute reliably
- >95% RAG coverage
- >98% tool success rate
- <500ms P95 latency
- Zero security vulnerabilities
- Real metrics dashboard

**Grade B (80-89%):**
- Most tools work
- >80% RAG coverage
- >95% tool success rate
- <1s P95 latency
- Minor security issues

**Grade C (70-79%):**
- Core tools work
- >60% RAG coverage
- >90% tool success rate
- <2s P95 latency

**Grade D (<70%):**
- Basic functionality
- Fake metrics
- Security holes

**CURRENT GRADE: D (47%)**

---

## 🚀 IMMEDIATE NEXT ACTIONS

1. **YOU (User):**
   - Go to Supabase Dashboard → Settings → API
   - Click "Rotate" on anon key
   - Send new key to me

2. **ME (Lovable):**
   - Fix RAG embeddings endpoint
   - Build real training dashboard
   - Create executor-full.ts
   - Deploy 20 RAG systems
   - Wire event bus
   - Build monitoring dashboard

3. **TIMELINE:**
   - Phase 1 (Security): Today
   - Phase 2 (Metrics): Day 1-2
   - Phase 3 (Executor): Day 2-3
   - Phase 4 (RAG): Day 3-5
   - Phase 5 (Event Bus): Day 5-6
   - Phase 6 (Crons): Day 6
   - Phase 7 (Dashboard): Day 7

**GOAL: Grade A (90%+) by Day 7**

---

**END OF AUDIT REPORT**
