# Incident Response Runbook

## 🚨 Severity Levels

### P0 - Critical (Complete Outage)
- **Response Time:** Immediate
- **Examples:** Site down, database inaccessible, auth broken
- **Action:** Page on-call, assemble war room

### P1 - High (Major Feature Broken)
- **Response Time:** < 15 minutes
- **Examples:** Payments failing, feed not loading, posts not saving
- **Action:** Notify team, start investigation

### P2 - Medium (Degraded Experience)
- **Response Time:** < 1 hour
- **Examples:** Slow queries, intermittent errors, some users affected
- **Action:** Create ticket, assign owner

### P3 - Low (Minor Issue)
- **Response Time:** Next business day
- **Examples:** UI glitches, non-critical features, cosmetic issues
- **Action:** Add to backlog

---

## 🔍 Investigation Checklist

### 1. Gather Context (5 min)
- [ ] Check Sentry for error spikes
- [ ] Check Supabase metrics dashboard
- [ ] Check recent deploys (last 2 hours)
- [ ] Check feature flag changes
- [ ] Review user reports

### 2. Identify Scope (5 min)
- [ ] How many users affected? (%)
- [ ] Which features broken?
- [ ] Which routes/components failing?
- [ ] Any patterns? (browser, device, time)

### 3. Quick Mitigations (10 min)
- [ ] Can we rollback? (via Lovable History)
- [ ] Can we kill-switch a feature?
- [ ] Can we route around the issue?
- [ ] Do we need to scale resources?

---

## 🛠️ Rollback Procedure

### Via Feature Flags (Fastest)
```typescript
// In src/lib/feature-flags.ts
export const FLAGS = {
  problematic_feature: {
    rollout: 0.0, // Set to 0
    kill_switch: true // Enable kill switch
  }
};
```

### Via Lovable History
1. Open History view in Lovable
2. Find last known good version
3. Click "Restore"
4. Verify fix in preview
5. Re-publish

### Via Database (Last Resort)
```sql
-- Rollback migration
SELECT version FROM supabase_migrations.schema_migrations 
ORDER BY version DESC LIMIT 5;

-- Contact Lovable support for migration rollback
```

---

## 📊 Debugging Queries

### Check Error Rate
```typescript
// In Sentry
// Filter: last 1 hour
// Group by: error type
// Sort by: event count
```

### Check Slow Queries
```sql
-- In Supabase SQL Editor
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 200
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Check RLS Policy Issues
```sql
-- Test RLS for specific user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-id-here"}';

-- Try the failing query
SELECT * FROM table_name WHERE condition;
```

### Check Rate Limits
```sql
SELECT 
  scope,
  count,
  window_start
FROM rate_limit_counters
WHERE window_start > now() - interval '1 hour'
ORDER BY count DESC;
```

---

## 🔧 Common Issues & Fixes

### Issue: "Row violates RLS policy"
**Cause:** Missing user_id or incorrect policy
**Fix:**
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Verify user_id is set
-- In your insert, ensure user_id = auth.uid()
```

### Issue: "Function does not exist"
**Cause:** Migration not applied or types not regenerated
**Fix:**
1. Check migrations applied: `SELECT * FROM supabase_migrations.schema_migrations`
2. Re-run migration if missing
3. Wait for types to regenerate (2-3 min)

### Issue: "Too many connections"
**Cause:** Connection pool exhausted
**Fix:**
```typescript
// Use connection pooling
// Ensure all queries use supabase client (it pools)
// Check for connection leaks (unclosed connections)
```

### Issue: "Rate limit exceeded"
**Cause:** User or IP hit rate limit
**Fix:**
```typescript
// Temporary increase in rate-limit-wrapper.ts
export const RateLimits = {
  standard: { calls: 100, window: '1m' }, // Increased from 60
};

// Or implement exponential backoff on client
```

---

## 📝 Post-Incident

### Immediate (Within 1 hour)
- [ ] Post status update to users
- [ ] Document timeline in incident log
- [ ] Assign owner for post-mortem

### Post-Mortem (Within 48 hours)
- [ ] What happened? (timeline)
- [ ] Root cause?
- [ ] Why didn't we catch it?
- [ ] Action items to prevent recurrence

### Follow-up (Within 1 week)
- [ ] Complete action items
- [ ] Update runbooks
- [ ] Add monitoring/alerts
- [ ] Share learnings with team

---

## 📞 Escalation

### Level 1: Self-service
- Use this runbook
- Check Sentry, logs, metrics
- Attempt rollback via flags/history

### Level 2: Team
- Post in team chat
- @ mention relevant engineer
- Share Sentry link + context

### Level 3: Lovable Support
- Email: support@lovable.dev
- Include: Project ID, error logs, steps to reproduce
- For database issues: Include SQL query + error message

---

## 🎯 Success Metrics

**Target MTTR (Mean Time To Recovery):**
- P0: < 15 minutes
- P1: < 1 hour
- P2: < 4 hours

**Error Budget:**
- 99.9% uptime (43 minutes downtime/month)
- Error rate < 0.5%
- p95 latency < 200ms

**When to Escalate:**
- Can't identify root cause in 15 min
- Rollback doesn't fix issue
- Affecting >10% of users
- Data loss or security incident
