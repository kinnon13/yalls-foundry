# Quick Start - UI Testing

## ✅ System Status: READY

All seeds planted, system configured. Time to test!

### Pre-Flight Confirmation

```
✅ 3 Proactive Suggestions ready to execute
✅ 1 Incident ready to resolve
✅ 1 Change Proposal pending approval
✅ 1 User Profile configured for personalization
✅ 3 Model Routes (chat.reply, mdr.generate, vision.analyze)
✅ 2 Model Budgets (grok-2 $200, grok-mini $100)
✅ Control Flags: Ready (pause=false, freeze=false, external=true)
```

---

## Start Testing in 30 Seconds

### 1. Start Dev Server
```bash
pnpm install
pnpm dev
```

### 2. Open These URLs

| Page | What to Test | Expected |
|------|-------------|----------|
| `/super` | Overview metrics | Health OK, Queue stable, DLQ ≈ 0 |
| `/super/flags` | Toggle External Calls | State persists on refresh |
| `/super/pools` | Edit pool concurrency | Updates and saves |
| `/super/incidents` | Resolve incident | Moves to Resolved |
| `/super-andy-v2` | Proactive rail | 3 suggestions visible |
| `/super-andy-v2` | Execute Now button | Jobs spawn |

---

## The 3 Seeded Suggestions

1. **Consolidate backlog** (85% confidence)
   - Type: optimization
   - Description: "Detected 47 stale tasks across teams..."

2. **Optimize model routing cost** (92% confidence)
   - Type: efficiency
   - Description: "Current spend trending toward soft limit (78%)..."

3. **Improve reminder hygiene** (78% confidence)
   - Type: quality
   - Description: "CTM reminders have 12% follow-through rate..."

**Action:** Click "Execute Now" on any of these → should spawn orchestrator jobs

---

## The Seeded Incident

**Title:** "Budget soft limit reached"  
**Severity:** medium  
**Source:** circuit_breaker_tick  
**Details:** Model budget for grok-2 reached 82% of monthly limit

**Action:** Click "Resolve" → should mark as resolved with timestamp

---

## Quick Smoke Commands

### Generate More Suggestions
```bash
curl -s "https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/perceive_tick" \
  -H "Content-Type: application/json" -d '{}' | jq .
```

### Trigger Self-Improvement
```bash
curl -s "https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/self_improve_tick" \
  -H "Content-Type: application/json" -d '{}' | jq .
```

### Test Model Router
```bash
curl -s "https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/model_router" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":null,"taskClass":"mdr.generate","requiredTokens":4096}' | jq .
```

Expected response:
```json
{
  "model": "grok-2",
  "maxTokens": 8192,
  "temperature": 0.3,
  "downgraded": false
}
```

---

## Emergency Rollback

If something goes wrong:

```sql
-- Kill switch
UPDATE ai_control_flags 
SET global_pause = true, write_freeze = true, external_calls_enabled = false;

-- Then investigate, fix, and re-enable:
UPDATE ai_control_flags 
SET global_pause = false, write_freeze = false, external_calls_enabled = true;
```

---

## What You Should See

### In `/super-andy-v2`:

**Proactive Suggestions Rail:**
- 3 cards with titles, descriptions, confidence scores
- "Execute Now" and "Dismiss" buttons
- Clicking Execute Now shows toast: "Execution started"

**Self-Improvement Log:**
- "Run Now" button
- After click: New entry with before/after policy diff
- Clear rationale for each change

### In `/super/incidents`:
- Table with 1 open incident
- Severity badge (orange for medium)
- "Resolve" button → clicking updates status

### In `/super`:
- Health: Green checkmark
- Queue Depth: Low number (< 100)
- DLQ: Zero or very low
- Latency: < 250ms

---

## Pass Criteria Checklist

- [ ] All pages load without errors
- [ ] Proactive suggestions display (3 items)
- [ ] Execute Now spawns jobs
- [ ] Incident can be resolved
- [ ] Flags toggle and persist
- [ ] No console errors
- [ ] Model router returns valid config

**When all checked:** ✅ System is production-ready!

---

## Need Help?

Check the full test plan: `docs/testing/UI_TEST_PLAN.md`

Or run database verification:
```sql
select 
  'Suggestions' as item, count(*)::text as ready 
  from ai_proactive_suggestions where executed = false
union all
select 'Incidents', count(*)::text 
  from ai_incidents where resolved_at is null
union all
select 'Routes', count(*)::text 
  from ai_model_routes;
```

Expected: Suggestions=3, Incidents=1, Routes=3

---

**Status:** 🚀 Ready to test! Start the dev server and open `/super`
