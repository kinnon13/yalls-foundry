# Production Smoke Test (8-Minute Gate)

Run these queries to verify core systems before going live.

## 1. Feed Fusion (2 min)

```sql
-- Test pagination stability & blend caps
SELECT * FROM public.feed_fusion_home('for_you', NULL, NULL, 50);
-- Verify: no duplicate IDs, listings < 20% of total, stable cursor values

SELECT * FROM public.feed_fusion_profile('<entity_id>', NULL, NULL, 50);
-- Verify: returns entity's posts + approved tagged posts
```

**Expected:**
- ✅ 50 unique items with next_cursor_ts/next_cursor_id
- ✅ Shop items ≤ 10 (20% of 50)
- ✅ No items user has in cart (if cart_items.user_id populated)
- ✅ No hidden items (check feed_hides)

## 2. Notifications (2 min)

```sql
-- Test idempotency
SELECT public.notif_send(auth.uid(), 'inapp', 'test', 'Test Title', 'Body', NULL, 'smoke-1');
SELECT public.notif_send(auth.uid(), 'inapp', 'test', 'Test Title', 'Body', NULL, 'smoke-1');
-- Verify: returns same UUID (1 row created)

-- Test quiet hours (if set)
UPDATE public.ai_consent SET quiet_hours = int4range(22, 6) WHERE user_id = auth.uid();
-- Run notif_send during 22:00-06:00 → returns NULL

-- Test daily cap
SELECT public.notif_send(auth.uid(), 'email', 'test', 'Cap Test ' || i::text, NULL, NULL, 'cap-' || i::text)
FROM generate_series(1, 10) i;
-- Verify: only 5 rows created (default cap)

-- Test mark-all-read
SELECT public.notif_mark_all_read();
-- Verify: read_at populated on unread rows
```

**Expected:**
- ✅ Idempotency: same key = same UUID
- ✅ Quiet hours: NULL return during quiet window
- ✅ Daily cap: stops at frequency_cap (default 5)
- ✅ Mark read: updates read_at timestamp

## 3. Earnings (1 min)

```sql
-- Insert test events
INSERT INTO public.earnings_events(user_id, entity_id, kind, amount_cents, occurred_at, captured)
VALUES 
  (auth.uid(), NULL, 'commission', 1500, now(), true),
  (auth.uid(), NULL, 'referral', 500, now(), false);

-- Recompute ledger
SELECT public.earnings_recompute(auth.uid());

-- Verify ledger
SELECT * FROM public.earnings_ledger WHERE user_id = auth.uid();
-- Expected: total_earned_cents=2000, total_captured_cents=1500, pending_cents=500
```

**Expected:**
- ✅ Ledger totals = SUM(events)
- ✅ Pending = total - captured
- ✅ Missed = events that expired uncaptured

## 4. Workers (3 min)

```sql
-- Create test job with idempotency
SELECT public.worker_enqueue('test_job', '{"foo":"bar"}'::jsonb, 'smoke-job-1', 3, now());
SELECT public.worker_enqueue('test_job', '{"foo":"bar"}'::jsonb, 'smoke-job-1', 3, now());
-- Verify: returns same job_id (1 row created)

-- Create poison job (will fail → DLQ)
INSERT INTO public.worker_jobs(job_type, payload, max_attempts, next_run_at, status)
VALUES ('poison_job', '{"force_fail":true}'::jsonb, 3, now(), 'pending');

-- Trigger worker (call edge function 3+ times)
-- curl -X POST https://<edge>/functions/v1/worker-process

-- After 3 failures, verify DLQ
SELECT * FROM public.dead_letter_queue WHERE job_type = 'poison_job';
-- Expected: 1 row with attempts=3, error message present

-- Verify backoff timing
SELECT id, status, attempts, next_run_at, error 
FROM public.worker_jobs 
WHERE job_type = 'poison_job'
ORDER BY created_at DESC LIMIT 1;
-- Expected: status='dlq' after 3 attempts
```

**Expected:**
- ✅ Idempotency: duplicate key = same job_id
- ✅ Backoff: 60s → 120s → 240s between retries
- ✅ DLQ: after max_attempts, status='dlq', row in dead_letter_queue
- ✅ Error column: populated with failure reason

## 5. Health Check (30 sec)

```bash
curl -sS https://<your-project>.supabase.co/functions/v1/health | jq
```

**Expected:**
```json
{
  "ok": true,
  "status": "healthy",
  "checks": {
    "database": "up",
    "latency_ms": 150
  },
  "version": "main"
}
```

**Gates:**
- ✅ `ok: true`
- ✅ `latency_ms < 500`
- ✅ No errors in logs

---

## Pass Criteria

All 5 tests must pass:
- ✅ Feed returns stable paginated results with blend caps
- ✅ Notifications respect idempotency, caps, quiet hours
- ✅ Earnings ledger = SUM(events), recompute is idempotent
- ✅ Workers retry with exponential backoff, DLQ after max attempts
- ✅ Health endpoint responds in <500ms

**If any test fails:** Do NOT ship. Debug the specific failure first.

**Ship confidence after passing:** A+ (ready for production traffic)
