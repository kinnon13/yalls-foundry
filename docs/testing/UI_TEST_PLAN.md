# Super Andy UI Test Plan

**Version:** 1.0  
**Date:** 2025-10-22  
**Duration:** 15-20 minutes  
**Status:** Ready to Execute

## Preflight Checklist ✅

### System Readiness
- [x] Control flags verified (pause=false, freeze=false, external=true)
- [x] 3 proactive suggestions seeded
- [x] 1 incident seeded for resolution testing  
- [x] 1 user profile configured
- [x] Model routes configured (3)
- [x] Model budgets set (grok-2 $200, grok-mini $100)
- [x] Ethics policies active (2)

### Quick Status Check
```sql
-- Run this to verify system is ready
select 
  (select count(*) from ai_proactive_suggestions where executed = false) as suggestions,
  (select count(*) from ai_incidents where resolved_at is null) as incidents,
  (select count(*) from ai_user_profiles) as profiles,
  (select count(*) from ai_model_routes) as routes,
  (select global_pause from ai_control_flags limit 1) as paused
;
```

Expected: suggestions=3, incidents=1, profiles=1, routes=3, paused=false

---

## Test Execution

### Start Dev Server
```bash
pnpm install
pnpm dev
```

---

## Test Flow 1: Super Console Overview

**URL:** `/super`

**Expected Results:**
- ✅ Health status = OK
- ✅ Latency < 250ms  
- ✅ Queue Depth stable (not climbing)
- ✅ DLQ ≈ 0 (or decaying via dlq_replay)
- ✅ Active Workers > 0 with most showing "OK" status

**Test Actions:**
1. Open `/super`
2. Verify all tiles populate with data
3. Check health indicator is green
4. Observe queue metrics are reasonable

**Pass Criteria:** All metrics display correctly, no error states

---

## Test Flow 2: Kill Switch & Flags

**URL:** `/super/flags`

**Expected Results:**
- ✅ Flags display current state
- ✅ Toggle persists across page refresh
- ✅ External Calls OFF triggers downgrade behavior
- ✅ Global Pause stops workers from picking jobs

**Test Actions:**
1. Open `/super/flags`
2. Toggle **External Calls Enabled** to OFF
3. Call model_router: `curl "$FUNCTIONS_BASE/model_router" -d '{"taskClass":"mdr.generate","requiredTokens":4096}'`
4. Verify response shows `downgraded: true` or blocked
5. Toggle External Calls back to ON
6. Refresh page, verify toggle state persisted

**Optional:** Test Global Pause
- Toggle Global Pause ON
- Verify workers stop pulling jobs in `/super/workers`
- Toggle back OFF

**Pass Criteria:** Toggles work, state persists, system respects flags

---

## Test Flow 3: Proactive Suggestions

**URL:** `/super-andy-v2`

**Expected Results:**
- ✅ Proactive Suggestions rail shows 3 suggestions
- ✅ Each suggestion has title, description, confidence score
- ✅ "Execute Now" button enqueues orchestrator jobs
- ✅ Jobs appear in `/super/workers`
- ✅ `ai_subagent_runs` table receives new rows
- ✅ `ai_action_ledger` shows `orchestrate.spawn` events

**Test Actions:**
1. Open `/super-andy-v2`
2. Verify Proactive Suggestions rail shows:
   - "Consolidate backlog" (85% confidence)
   - "Optimize model routing cost" (92% confidence)  
   - "Improve reminder hygiene" (78% confidence)
3. Click **Execute Now** on one suggestion
4. Verify toast: "Execution started" or "Probe enqueued"
5. Check `/super/workers` for running jobs
6. Query database:
```sql
select agent_name, success, created_at 
from ai_subagent_runs 
order by created_at desc limit 3;

select topic, payload 
from ai_action_ledger 
where topic = 'orchestrate.spawn' 
order by created_at desc limit 1;
```

**Pass Criteria:** 
- Suggestions display
- Execute Now works
- Jobs spawn and complete
- Database records created

---

## Test Flow 4: Self-Improvement Loop

**URL:** `/super-andy-v2` (Self-Improvement Log rail)

**Expected Results:**
- ✅ "Run Now" button triggers self-improvement analysis
- ✅ New entry appears with before/after JSON
- ✅ `ai_change_proposals` receives policy tweak proposal
- ✅ Rationale explains the change

**Test Actions:**
1. In Self-Improvement Log rail, click **Run Now**
2. Wait for toast confirmation
3. Verify new entry appears showing:
   - Change type: "policy_weight"
   - Before/After JSON diff
   - Rationale text
4. Query database:
```sql
select id, target_scope, target_ref, status, created_at
from ai_change_proposals
where status = 'proposed'
order by created_at desc limit 1;
```

**Pass Criteria:**
- Run Now triggers analysis
- Entry displays with diff
- Proposal created in database

---

## Test Flow 5: Incident Management

**URL:** `/super/incidents`

**Expected Results:**
- ✅ Incidents list shows seeded incident
- ✅ Severity badge displays correctly (medium)
- ✅ Resolve action works
- ✅ Incident moves to Resolved state
- ✅ `resolved_at` timestamp set in database

**Test Actions:**
1. Open `/super/incidents`
2. Verify incident appears:
   - Title: "Budget soft limit reached"
   - Severity: medium
   - Source: circuit_breaker_tick
3. Click **Resolve** button
4. Verify toast: "Incident resolved"
5. Verify incident disappears from active list or shows "Resolved"
6. Query database:
```sql
select id, severity, summary, resolved_at 
from ai_incidents 
order by created_at desc limit 1;
```

**Pass Criteria:**
- Incident displays correctly
- Resolve action works
- Database updated with resolved_at

---

## Test Flow 6: Personalization in Chat

**URL:** `/super-andy-v2` (Chat section) or Andy Preferences component

**Expected Results:**
- ✅ Preferences load from `ai_user_profiles`
- ✅ Changes persist to database
- ✅ Chat responses reflect preferences:
  - Tone: friendly concise
  - Format: bullets
  - Approval Mode: ask before executing

**Test Actions:**
1. Open Andy Preferences (if available) or verify profile:
```sql
select user_id, tone, verbosity, format_pref, approval_mode 
from ai_user_profiles 
where user_id = '00000000-0000-0000-0000-000000000007';
```
2. Expected values:
   - Tone: "friendly concise"
   - Format: "bullets"
   - Approval Mode: "ask"
3. Send a test message in Andy Chat
4. Verify response is:
   - Concise (not verbose)
   - Formatted as bullets
   - Asks for confirmation before actions

**Pass Criteria:**
- Profile loads correctly
- Chat respects preferences
- Format matches configured style

---

## Test Flow 7: Model Router & Budget Awareness

**API Test via curl or function call**

**Expected Results:**
- ✅ Router returns valid model configuration
- ✅ Includes model name, max_tokens, temperature
- ✅ Shows `downgraded: true` when budget soft limit hit
- ✅ Respects task_class routing rules

**Test Actions:**
```bash
# 1. Normal routing
curl -s "$FUNCTIONS_BASE/model_router" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":null,"taskClass":"mdr.generate","requiredTokens":4096}' \
  | jq .

# Expected: model="grok-2", maxTokens=8192, temperature=0.3

# 2. Test budget awareness (optional - requires setting spent_usd high)
# Update budget to 80%:
# update ai_model_budget set spent_usd = 160 where model_name = 'grok-2';

# Call router again - should show downgrade
```

**Pass Criteria:**
- Router returns valid configuration
- Respects routing rules from `ai_model_routes`
- Budget awareness triggers downgrade when needed

---

## Test Flow 8: Circuit Breakers Visual

**URL:** `/super` and `/super/pools`

**Expected Results:**
- ✅ Overview stays green under normal load
- ✅ High DLQ triggers pool concurrency clamp
- ✅ Incident opens when breaker trips
- ✅ Pool concurrency visible in Pools page

**Test Actions:**
1. Monitor `/super` Overview - should be green
2. Check `/super/pools` - verify concurrency values are sane
3. (Optional stress test) Artificially spike DLQ:
```sql
-- Force some failed jobs into DLQ
insert into ai_job_dlq (job_id, original_queue, payload, failure_reason)
select gen_random_uuid(), 'research.gap_find', '{}'::jsonb, 'test_overload'
from generate_series(1, 100);
```
4. Wait for `circuit_breaker_tick` to run (runs every 60s)
5. Verify:
   - Pool concurrency reduced in `/super/pools`
   - New incident opened in `/super/incidents`
   - Overview shows warning state

**Pass Criteria:**
- System handles load gracefully
- Circuit breakers activate appropriately
- UI reflects breaker state changes

---

## Quick Smoke Commands

Run these anytime to populate live data:

```bash
# Generate proactive suggestions
curl -s "$FUNCTIONS_BASE/perceive_tick" \
  -H "Content-Type: application/json" -d '{}' | jq .

# Trigger self-improvement
curl -s "$FUNCTIONS_BASE/self_improve_tick" \
  -H "Content-Type: application/json" -d '{}' | jq .

# Test model router
curl -s "$FUNCTIONS_BASE/model_router" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":null,"taskClass":"chat.reply","requiredTokens":2048}' | jq .

# Generate daily digest (creates ai_daily_reports row)
curl -s "$FUNCTIONS_BASE/daily_digest_tick" \
  -H "Content-Type: application/json" -d '{}' | jq .
```

---

## Definition of Done

All 8 test flows must pass:

- [ ] Test 1: Overview loads with valid metrics
- [ ] Test 2: Flags toggle and persist
- [ ] Test 3: Proactive suggestions display and execute
- [ ] Test 4: Self-improve generates proposals
- [ ] Test 5: Incidents can be resolved
- [ ] Test 6: Personalization reflects in chat
- [ ] Test 7: Model router returns valid config
- [ ] Test 8: Circuit breakers visible and functional

**No unhandled errors** in browser console or network tab.

---

## Rollback Plan

If any critical issue found:

```sql
-- Emergency kill switch
UPDATE ai_control_flags 
SET global_pause = true, write_freeze = true, external_calls_enabled = false;

-- Reset circuit breakers
UPDATE topic_circuit_breakers 
SET state = 'closed', total_count = 0, error_count = 0, last_reset_at = now();

-- Revert model downgrades
UPDATE ai_model_routes 
SET model_name = CASE 
  WHEN task_class = 'mdr.generate' THEN 'grok-2'
  WHEN task_class = 'vision.analyze' THEN 'grok-vision'
  ELSE model_name 
END;
```

---

## Post-Test Monitoring

Watch these metrics for 24h after go-live:

1. **Queue Health** (`/super`)
   - Queue depth should stay flat or decrease
   - DLQ should be near zero

2. **Budget Tracking** (`ai_model_budget`)
   - Monitor `spent_usd` vs `monthly_limit_usd`
   - Soft clamp at 80%, hard at 95%

3. **Incident Rate** (`/super/incidents`)
   - Should be low and decreasing
   - Any critical incidents need immediate attention

4. **Self-Improvement** (`ai_change_proposals`)
   - Daily proposals should have clear rationale
   - Review before applying

---

## Need Playwright Specs?

Reply "yes" to get automated test specs for these 8 flows that can run with one command.

**Status:** ✅ Ready for UI Testing - Start Server and Execute Test Flows
