# Production Rollback Plan

Emergency procedures for reverting changes if issues arise.

## Rollback Scenarios

### Scenario 1: Workers Failing (DLQ Flood)

**Symptoms:**
- Dead letter queue growing rapidly (> 100 jobs/min)
- Worker jobs stuck in 'running' status
- User-facing features timing out

**Immediate Action (< 1 min):**
```sql
-- Pause all pending jobs
UPDATE public.worker_jobs 
SET status = 'paused', updated_at = now()
WHERE status = 'pending';

-- Kill stuck jobs
UPDATE public.worker_jobs
SET status = 'failed', error = 'Emergency rollback', updated_at = now()
WHERE status = 'running' 
  AND started_at < now() - interval '5 minutes';
```

**Rollback worker_fail_job (< 2 min):**
```sql
CREATE OR REPLACE FUNCTION public.worker_fail_job(p_job_id uuid, p_error text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Simple fail without retry logic
  UPDATE public.worker_jobs 
  SET status='failed', error=p_error, updated_at=now() 
  WHERE id=p_job_id;
END $$;
```

**Resume (after fix):**
```sql
UPDATE public.worker_jobs 
SET status = 'pending', next_run_at = now(), error = NULL
WHERE status = 'paused';
```

---

### Scenario 2: Notifications Spamming Users

**Symptoms:**
- Users reporting excessive notifications
- Consent settings not being respected
- Email/SMS charges spiking

**Immediate Action (< 30 sec):**
```sql
-- Disable all notification triggers
ALTER TABLE public.notifications DISABLE TRIGGER ALL;

-- Or: Set everyone's cap to 0
UPDATE public.ai_consent SET frequency_cap = 0;
```

**Rollback notif_send (< 1 min):**
```sql
CREATE OR REPLACE FUNCTION public.notif_send(
  p_user_id uuid,
  p_channel text,
  p_kind text,
  p_title text,
  p_body text DEFAULT NULL,
  p_data jsonb DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS uuid AS $$
BEGIN
  -- Disable sends temporarily
  RETURN NULL;
END $$ 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Resume (after fix):**
```sql
-- Re-enable triggers
ALTER TABLE public.notifications ENABLE TRIGGER ALL;

-- Or: Restore cap
UPDATE public.ai_consent SET frequency_cap = 5;
```

---

### Scenario 3: Feed Returning Duplicates

**Symptoms:**
- Users seeing same items multiple times
- Pagination broken (cursor not advancing)
- Frontend infinite scroll looping

**Immediate Action (< 30 sec):**
```sql
-- Disable feed functions temporarily
CREATE OR REPLACE FUNCTION public.feed_fusion_home(...)
RETURNS SETOF feed_row AS $$
BEGIN
  RAISE EXCEPTION 'Feed temporarily disabled for maintenance';
END $$ 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Diagnosis:**
```sql
-- Check for duplicate IDs in feed output
WITH feed_output AS (
  SELECT * FROM public.feed_fusion_home('for_you', NULL, NULL, 100)
)
SELECT item_id, COUNT(*) as cnt
FROM feed_output
GROUP BY item_id
HAVING COUNT(*) > 1;
-- Should be empty
```

**Fix:**
- Verify tie-breaker indexes exist (created_at DESC, id DESC)
- Ensure DISTINCT ON or LIMIT logic isn't broken
- Check cart suppression join isn't duplicating rows

---

### Scenario 4: Earnings Ledger Wrong

**Symptoms:**
- User reports incorrect earnings totals
- Ledger doesn't match SUM(events)
- Missing/double-counted transactions

**Immediate Action (< 30 sec):**
```sql
-- Lock earnings writes
ALTER TABLE public.earnings_events DISABLE TRIGGER ALL;
```

**Diagnosis:**
```sql
-- Compare ledger vs events
SELECT 
  l.user_id,
  l.total_earned_cents as ledger_total,
  COALESCE(SUM(e.amount_cents), 0) as events_total,
  l.total_earned_cents - COALESCE(SUM(e.amount_cents), 0) as diff
FROM public.earnings_ledger l
LEFT JOIN public.earnings_events e ON e.user_id = l.user_id
GROUP BY l.user_id, l.total_earned_cents
HAVING ABS(l.total_earned_cents - COALESCE(SUM(e.amount_cents), 0)) > 0;
-- Should be empty
```

**Fix:**
```sql
-- Recompute all ledgers
SELECT public.earnings_recompute(user_id)
FROM (SELECT DISTINCT user_id FROM public.earnings_events) u;
```

**Resume:**
```sql
ALTER TABLE public.earnings_events ENABLE TRIGGER ALL;
```

---

### Scenario 5: Rate Limiting Too Aggressive

**Symptoms:**
- Legitimate users getting 429 errors
- Rate limit counters hitting cap frequently
- User complaints about "slow down" messages

**Immediate Action (< 1 min):**
```sql
-- Temporarily increase limits
UPDATE public.rate_limit_configs
SET limit = limit * 2
WHERE scope LIKE '%user%';

-- Or: Clear all counters (emergency only)
TRUNCATE public.rate_limit_counters;
```

**Long-term Fix:**
- Review rate limit configs per endpoint
- Implement tiered limits (free vs paid users)
- Add bypass for verified/trusted users

---

## Health Check Gates

Before ANY production deploy:
1. ✅ Run smoke tests (see SMOKE-TEST.md)
2. ✅ Verify health endpoint returns `ok: true`
3. ✅ Check DLQ is empty (`SELECT COUNT(*) FROM dead_letter_queue;`)
4. ✅ Confirm no stuck workers (`SELECT COUNT(*) FROM worker_jobs WHERE status='running' AND started_at < now() - interval '5min';`)
5. ✅ Test notification idempotency (send same key twice → 1 row)

## Post-Rollback Validation

After rolling back ANY component:
1. Run health check: `curl https://<edge>/health`
2. Verify DLQ stopped growing
3. Check error rate in Sentry (should drop to < 0.1%)
4. Confirm user-facing features work (manual test)
5. Monitor for 15 minutes before considering stable

---

## Emergency Contacts

- **On-Call Engineer**: [Your contact]
- **Supabase Support**: support@supabase.io
- **Database DBA**: [Your DBA]

## Incident Response Time

- **Critical (P0)**: < 5 min response, < 15 min mitigation
- **High (P1)**: < 15 min response, < 1 hour mitigation
- **Medium (P2)**: < 1 hour response, < 4 hour mitigation

**Critical = Money loss, data corruption, or complete service down**
**High = Degraded performance affecting >10% users**
**Medium = Non-critical feature broken, <10% users affected**
