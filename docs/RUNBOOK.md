# Production Runbook

## Quick Diagnostics

### Worker Health
```sql
-- Check queue backlog
SELECT * FROM public.vw_discovery_queue_health;
SELECT * FROM public.vw_events_queue_health;

-- Stuck leases
SELECT count(*) FROM public.marketplace_discovery_queue
WHERE status='processing' AND lease_expires_at < now();

SELECT count(*) FROM public.events_queue
WHERE status='leased' AND lease_expires_at < now();
```

### Performance SLOs
```sql
-- Kernel latency (auth, onboarding)
SELECT * FROM public.vw_kernel_slos;

-- Gap severity
SELECT * FROM public.vw_gap_severity LIMIT 20;
```

### Vector Health
```sql
-- pgvector available
SELECT extname FROM pg_extension WHERE extname='vector';

-- Non-null embedding ratio (needs >5% for planner)
SELECT count(*) FILTER (WHERE embedding IS NOT NULL)::float / count(*) AS pct_has_vec
FROM public.interest_catalog;
```

## Incident Response

### Worker Stuck (p95_age_sec > 300)
1. Check worker logs for errors
2. Redeploy worker function
3. Requeue stuck items:
```sql
UPDATE public.events_queue 
SET status='queued', lease_token=NULL, lease_expires_at=NULL
WHERE status='leased' AND lease_expires_at < now();
```

### Discovery Queue Backlog
```sql
-- Inspect errors
SELECT id, interest_id, category_id, reason, last_error, attempts
FROM public.marketplace_discovery_queue
WHERE status='error'
ORDER BY updated_at DESC
LIMIT 20;

-- Requeue if attempts < 5
UPDATE public.marketplace_discovery_queue
SET status='queued', attempts=0, last_error=NULL
WHERE status='error' AND attempts < 5;
```

### Empty Suggestions
- Fallback to popular/recent/global candidates
- Emit telemetry: `feed_fallback`
- Check marketplace_listings for target categories

### Redis Outage
- Feature store falls back to sessionStorage
- Log `feature_cache_miss` at warn level
- Don't block UI

## Maintenance

### Backfill Profile Embeddings
```sql
-- For all users with interests
SELECT public.recompute_profile_embedding(user_id)
FROM profiles
WHERE user_id IN (
  SELECT DISTINCT user_id FROM user_interests
)
LIMIT 1000; -- batch by 1000
```

### Cleanup Old Signals
```sql
-- Run daily via cron
SELECT public.gc_intent_signals();
SELECT public.gc_learning_events();
```

### Analyze After Bulk Updates
```sql
ANALYZE public.interest_catalog;
ANALYZE public.profiles;
ANALYZE public.marketplace_listings;
```

## Performance Tuning

### Autovacuum (already set to 2%)
- Hot tables: `events_queue`, `marketplace_discovery_queue`
- Monitor bloat with `pg_stat_user_tables`

### Statement Timeouts
- All heavy RPCs: 5s timeout
- Protects connection pool and UX

### Redis TTL
- User features: 3600s ± 10% jitter
- Item features: 3600s ± 10% jitter
- Prevents thundering herd on expiry

### Vector Indexes
- ivfflat lists: 200 for <1M rows, scale to 400-800
- Always ANALYZE after bulk inserts
- Requires >5% non-null embeddings for planner to use

## Monitoring Alerts

### Critical
- `vw_discovery_queue_health.p95_age_sec > 300` → worker stuck
- `vw_kernel_slos.p95_ms > 1000` → latency degradation
- Discovery queue: `high_retry_ct > 10` → systemic failure

### Warning
- Profile embeddings: `pct_has_vec < 0.5` → backfill needed
- Learning events: no data in 24h → exploration stopped

## Feature Flags

Rollout progression: 1% → 5% → 25% → 100%

Auto-rollback if:
- Error rate > 2%
- p95 latency > 2x baseline
- User complaints > threshold

## Security Checklist

- [x] All SECURITY DEFINER functions have `SET search_path=public`
- [x] Rate limits enforced on writes (likes, comments, follows)
- [x] RLS policies on all user data tables
- [x] Learning events write-only via service role
- [x] Idempotency keys on queues prevent duplicates

## Upgrade Path

### Next: Thompson Sampling
When you have ~1-2M learning_events:
- Replace ε-greedy with Thompson Sampling
- More data-efficient exploration
- Better handles cold-start

### Online Interest Drift
Decay `user_interests.affinity` by 0.98/week unless reinforced

### A/B Framework
Store experiment arm in Redis and stamp on `learning_events.context`
