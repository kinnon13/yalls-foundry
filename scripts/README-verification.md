# Phase 2 Verification Guide

Complete verification suite for billion-user scaling readiness.

## Quick Start

```bash
# 1. Verify codebase
chmod +x scripts/verify-phase2.sh
./scripts/verify-phase2.sh

# 2. Verify database
psql $DATABASE_URL -f scripts/verify-db.sql

# 3. Test CRM idempotency
psql $DATABASE_URL -f scripts/test-crm-idempotency.sql

# 4. Test outbox pattern
psql $DATABASE_URL -f scripts/test-outbox.sql

# 5. Test partition cutover (when ready)
psql $DATABASE_URL -f scripts/crm-partition-cutover.sql
```

## What Each Script Validates

### `verify-phase2.sh` (Codebase)
- ✅ No hardcoded tenant IDs (00000000-0000-0000-0000-000000000000)
- ✅ All edge functions have rate limiting (`withRateLimit`)
- ✅ No raw `console.*` calls in edge functions
- ✅ All files under 200 lines
- ✅ Using `ingest_event` RPC (not direct `resolve_contact`)
- ✅ TypeScript build succeeds

### `verify-db.sql` (Database)
- ✅ Critical functions exist (`ingest_event`, `resolve_contact`, `outbox_claim`, etc.)
- ✅ `crm_events` is partitioned
- ✅ At least 2 months of partitions exist
- ✅ Indexes present (tenant+ts, type+ts, contact+ts, idemKey)
- ✅ RLS enabled on all CRM tables
- ✅ Outbox table exists and is functional
- ✅ Data integrity checks pass

### `test-crm-idempotency.sql` (CRM Pattern)
- ✅ Idempotency keys prevent duplicate events
- ✅ Contact deduplication works (same email/externalId = 1 contact)
- ✅ Multiple identity types resolve correctly

### `test-outbox.sql` (Outbox Pattern)
- ✅ Messages can be claimed by workers
- ✅ Lease ownership is enforced
- ✅ Messages can be marked delivered
- ✅ Expired leases can be reclaimed

### `crm-partition-cutover.sql` (Cutover)
- Part 1: Verification (safe to run anytime)
- Part 2: Backfill loop (repeat until remaining=0)
- Part 3: Cutover (uncomment for low-traffic window)

## Expected Results

### All Green ✅
```
✅ All checks passed! Ready for scale.
```

### Warnings ⚠️
Yellow warnings are non-critical but should be addressed:
- Files slightly over 200 lines (split if critical paths)
- Console logs (replace with structured logging)

### Failures ❌
Red failures must be fixed before production:
- Hardcoded tenant IDs (run `deno run -A scripts/fix-hardcoded-tenants.ts`)
- Missing rate limits (run `deno run -A scripts/enforce-rate-limit.ts`)
- Build failures (fix TypeScript errors)

## Next Steps After All Green

1. **Enable Monitoring**
   - Set up alerts for p95 latency > 100ms
   - Monitor Redis hit rate (target >60%)
   - Track outbox backlog (should stay near 0)

2. **Scale Infrastructure**
   - Add read replica for dashboards/analytics
   - Enable connection pooler (PgBouncer)
   - Configure Redis for production workloads

3. **Automate Maintenance**
   ```sql
   -- Monthly partition creation (cron)
   SELECT app.ensure_next_crm_partition();
   
   -- Daily outbox cleanup (cron)
   DELETE FROM outbox 
   WHERE delivered_at < now() - interval '7 days';
   ```

4. **Load Test**
   - Simulate 10k concurrent users
   - Test edge function cold starts
   - Verify rate limiting kicks in appropriately

## Success Metrics (First 48h)

- **Latency**: p95 < 80ms, p99 < 150ms
- **Error Rate**: <0.5% 5xx errors
- **Cache Hit Rate**: >60% on hot reads
- **DB CPU**: <60% peak utilization
- **Outbox Backlog**: <100 messages steady state

## Troubleshooting

### "Missing rate limits in X functions"
```bash
deno run -A scripts/enforce-rate-limit.ts
git add supabase/functions
```

### "Found hardcoded tenant IDs"
```bash
deno run -A scripts/fix-hardcoded-tenants.ts
# Review changes, test, commit
```

### "Partition creation failed"
Check partition bounds don't overlap:
```sql
SELECT * FROM pg_inherits WHERE inhparent='public.crm_events'::regclass;
```

### "Outbox messages stuck"
Check for long-running transactions:
```sql
SELECT * FROM pg_stat_activity 
WHERE state != 'idle' 
AND query_start < now() - interval '1 minute';
```

## Performance Baselines

Use these to track improvements:

```sql
-- Query performance
EXPLAIN ANALYZE
SELECT * FROM crm_events
WHERE tenant_id = '<uuid>'
  AND ts > now() - interval '7 days'
ORDER BY ts DESC
LIMIT 100;

-- Partition pruning (should only scan 1 partition)
-- Index usage (should use idx_crm_events_tenant_ts)
-- Execution time (should be <10ms)
```

## Contact

For issues or questions about verification:
1. Check edge function logs in Supabase dashboard
2. Review database logs for RLS/permission errors
3. Run `EXPLAIN ANALYZE` on slow queries
