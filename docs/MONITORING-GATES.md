# Production Monitoring Gates

Turnkey alerts for billion-user scale.

## Critical Alerts (Page Immediately)

### 1. Health Check Down
```yaml
Alert: health_endpoint_failing
Condition: GET /functions/v1/health returns ok=false OR status != 200
Threshold: 2 consecutive failures (2 min window)
Action: Page on-call engineer
```

**Query:**
```bash
curl -sS https://<project>.supabase.co/functions/v1/health
# Expect: { "ok": true, "latency_ms": <500 }
```

### 2. Database Latency Spike
```yaml
Alert: database_slow
Condition: health.latency_ms > 500
Threshold: 5min p95 > 500ms
Action: Check PgBouncer, scale DB
```

### 3. Dead Letter Queue Growing
```yaml
Alert: dlq_accumulating
Condition: COUNT(*) FROM dead_letter_queue > 0
Threshold: Any row created in last 5min
Action: Investigate job failures, fix handler
```

**Query:**
```sql
SELECT COUNT(*) as dlq_count, 
       MAX(created_at) as most_recent
FROM public.dead_letter_queue
WHERE created_at > now() - interval '5 minutes';
-- Alert if dlq_count > 0
```

### 4. Worker Jobs Stuck
```yaml
Alert: workers_stuck
Condition: COUNT(*) FROM worker_jobs WHERE status='running' AND started_at < now() - interval '5 minutes'
Threshold: Any job running > 5min
Action: Kill stuck jobs, restart worker
```

**Query:**
```sql
SELECT COUNT(*) as stuck_count
FROM public.worker_jobs
WHERE status = 'running'
  AND started_at < now() - interval '5 minutes';
-- Alert if stuck_count > 0
```

## Warning Alerts (Slack Notification)

### 5. Error Rate Elevated
```yaml
Alert: error_rate_high
Condition: Check Sentry error rate
Threshold: > 1% of requests erroring in 10min window
Action: Review Sentry, check recent deploys
```

### 6. Rate Limits Hit
```yaml
Alert: rate_limits_exceeded
Condition: COUNT(*) FROM rate_limit_counters WHERE count >= limit
Threshold: > 10 users hitting limits in 5min
Action: Review rate limit configs, check for abuse
```

**Query:**
```sql
SELECT COUNT(DISTINCT scope) as limited_users
FROM public.rate_limit_counters
WHERE count >= 100  -- assuming default limit
  AND window_start > now() - interval '5 minutes';
-- Alert if limited_users > 10
```

### 7. Notification Cap Reached
```yaml
Alert: notification_suppression_high
Condition: % of notif_send calls returning NULL
Threshold: > 30% in 1 hour
Action: Review consent settings, adjust caps
```

## Performance Monitoring (Grafana/Datadog)

### Database Metrics
- **Query Time (p95)**: < 100ms for SELECT, < 200ms for writes
- **Connection Pool**: < 80% utilization (PgBouncer)
- **Cache Hit Rate**: > 95% (Redis when enabled)

### Edge Function Metrics
- **Cold Start**: < 500ms
- **Warm Latency**: < 50ms
- **Error Rate**: < 0.1%
- **Timeout Rate**: < 0.01%

### Feed API Metrics
- **Response Time (p95)**: < 200ms
- **Cache Hit Rate**: > 80% (Cloudflare when enabled)
- **Pagination Errors**: 0 (no duplicate IDs, stable cursors)

## Business Metrics (Daily Review)

### User Engagement
```sql
-- Daily active users
SELECT COUNT(DISTINCT user_id) as dau
FROM public.usage_events
WHERE created_at::date = current_date;
```

### Revenue (if applicable)
```sql
-- Daily GMV
SELECT SUM(total_cents) / 100.0 as daily_gmv_usd
FROM public.orders
WHERE status = 'completed'
  AND created_at::date = current_date;
```

### AI Interactions
```sql
-- Rocker engagement
SELECT COUNT(*) as ai_actions_today
FROM public.ai_action_ledger
WHERE created_at::date = current_date;
```

---

## Monitoring Stack Setup

### Option 1: Supabase Built-in (Free)
- Dashboard → Database → Query Performance
- Dashboard → API → Edge Function Logs
- Dashboard → Auth → User Activity

### Option 2: Sentry (Recommended)
1. Add `SENTRY_DSN` secret
2. Initialize in edge functions:
   ```typescript
   import * as Sentry from "https://esm.sh/@sentry/deno";
   Sentry.init({ dsn: Deno.env.get("SENTRY_DSN") });
   ```
3. Set up alerts for:
   - Error rate > 1%
   - Latency p95 > 500ms
   - DLQ jobs created

### Option 3: Custom Status Page
- Deploy `/health` endpoint
- Poll every 30s from status.yalls.ai
- Display uptime, latency, component status

---

## Rollback Procedures

### Emergency: Disable All Workers
```sql
UPDATE public.worker_jobs SET status = 'paused' WHERE status = 'pending';
```

### Emergency: Disable Notifications
```sql
ALTER TABLE public.notifications DISABLE TRIGGER ALL;
```

### Emergency: Revert worker_fail_job
```sql
CREATE OR REPLACE FUNCTION public.worker_fail_job(p_job_id uuid, p_error text)
RETURNS void AS $$
BEGIN
  UPDATE public.worker_jobs 
  SET status='failed', error=p_error, updated_at=now() 
  WHERE id=p_job_id;
END $$ 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Emergency: Rate Limit All Endpoints
```sql
-- Temporarily set aggressive limits
UPDATE public.rate_limit_counters SET limit = 10;
```

---

## Ship Checklist

Before deploying to production:
- [ ] Health endpoint returns `ok: true` and `latency_ms < 500`
- [ ] All smoke tests pass (see SMOKE-TEST.md)
- [ ] Sentry DSN configured (or monitoring alternative)
- [ ] PgBouncer enabled for connection pooling
- [ ] Redis enabled for caching (optional for v1)
- [ ] Cloudflare CDN configured (optional for v1)
- [ ] On-call engineer designated for critical alerts
- [ ] Rollback plan tested (can revert worker_fail_job in < 1 min)

**Post-Launch (First 24h):**
- Monitor DLQ every hour (should be empty)
- Check health endpoint every 5min (uptime > 99.9%)
- Review Sentry errors (< 10 unique errors)
- Validate feed pagination (no duplicate IDs reported)
- Confirm worker backoff (failed jobs retry at 60s/120s/240s)
