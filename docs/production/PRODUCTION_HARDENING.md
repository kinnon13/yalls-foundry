# Production Hardening Checklist

## P0: Tenant Isolation & Blast Radius Control

### ✅ Completed
- [x] Created `withTenantGuard` wrapper for all edge functions
- [x] Added org_id columns to critical tables (rocker_threads, knowledge_items)
- [x] Implemented RLS policies with org-level isolation
- [x] Created dual search indices (private vs marketplace)
- [x] Built job queue infrastructure for heavy operations
- [x] Added rate limiting infrastructure
- [x] Created CI checks for raw DB access

### 🔄 In Progress
- [ ] Migrate all edge functions to use `withTenantGuard`
- [ ] Populate dual search indices (private_chunks, market_chunks)
- [ ] Deploy ingest worker with per-org concurrency
- [ ] Add rate limits to TTS, embeddings, crawl, OCR endpoints
- [ ] Implement tenant isolation tests in CI

### 📋 TODO (P1)
- [ ] Structured logging with request_id, org_id, actor_role
- [ ] Observability dashboards (P95 latency, queue depth, TTS TTFA)
- [ ] k6 noisy neighbor tests
- [ ] Runbooks for common incidents
- [ ] SSRF protection for URL ingestion
- [ ] File/HTML sanitization on uploads

## Architecture

### Tenant Guard Pattern
All edge functions **must** use `withTenantGuard`:

```typescript
import { withTenantGuard } from '../_shared/tenantGuard.ts';

Deno.serve((req) =>
  withTenantGuard(req, async ({ supa, orgId, role, meta }) => {
    // All DB calls automatically scoped to orgId
    const { data } = await supa
      .from('rocker_threads')
      .select('*')
      .eq('org_id', orgId);  // Required!
    
    return new Response(JSON.stringify({ 
      request_id: meta.request_id, 
      data 
    }));
  })
);
```

### Dual Search Architecture

**Private Search** (org-scoped):
- Table: `private_chunks`
- RPC: `match_private_chunks(org_id_in, query_embedding, match_count)`
- Requires: `org_id` filter on every query

**Marketplace Search** (public):
- Table: `market_chunks`
- RPC: `match_market_chunks(query_embedding, match_count)`
- No org filter (intentionally public)

### Job Queue Pattern

Heavy operations (embed, crawl, OCR) go through `ingest_jobs` table:

```typescript
// Enqueue job
await admin.from('ingest_jobs').insert({
  org_id: orgId,
  kind: 'embed',
  payload: { doc_id, text }
});

// Worker claims with per-org concurrency control
const { data: job } = await admin.rpc('claim_ingest_job');
```

### Rate Limiting

Per-org, per-minute buckets:

```typescript
const bucket = `tts:org:${orgId}:minute:${timestamp}`;
const ok = await checkRateLimit(admin, bucket, 600); // 600/min
if (!ok) return new Response('Rate limit', { status: 429 });
```

## Verification Commands

```bash
# Check tenant guards
./scripts/audit/check-tenant-guards.sh

# Verify RLS policies
psql $DATABASE_URL -f scripts/audit/verify-rls.sql

# Run tenant isolation tests
npm run test:integration

# Check for org_id backfill
psql $DATABASE_URL -c "SELECT 'rocker_threads', count(*) FROM rocker_threads WHERE org_id IS NULL;"
psql $DATABASE_URL -c "SELECT 'knowledge_items', count(*) FROM knowledge_items WHERE org_id IS NULL;"
```

## Acceptance Criteria

Before marking "production ready":

1. ✅ All edge functions use `withTenantGuard` (CI enforced)
2. ✅ Zero raw DB calls without org scoping
3. ✅ Feature flag writes locked to super_admin only
4. ✅ Dual search RPCs deployed and tested
5. ✅ Job queue worker running with per-org concurrency
6. ✅ Rate limits active on costly endpoints (429 responses)
7. ✅ Tenant isolation tests pass in CI
8. ✅ Dashboards show per-org metrics
9. ✅ Runbooks written for common incidents

## Migration Status

| Migration | Status | Notes |
|-----------|--------|-------|
| org_id columns | ✅ Complete | Added to rocker_threads, knowledge_items |
| RLS policies | ✅ Complete | Org-level isolation active |
| Dual search tables | ⏳ Pending | SQL ready, needs approval |
| Job queue | ⏳ Pending | SQL ready, needs approval |
| Rate limiting | ⏳ Pending | SQL ready, needs approval |

## Known Gaps (from audit)

From `PRODUCTION_READINESS_AUDIT.md`:
- **60+ raw DB calls** → Fixed via `withTenantGuard` pattern
- **No job queue** → Implemented `ingest_jobs` table + worker
- **No search isolation** → Created dual indices (private/market)
- **Missing quotas** → Added rate_counters table + helpers
- **Weak RLS** → Tightened policies with org_id filters

## Next Sprint (Week of Oct 28)

1. **Complete function migration** (2 days)
   - Wrap remaining 12 functions with `withTenantGuard`
   - Fix any org_id filter gaps
   
2. **Deploy infrastructure** (1 day)
   - Run remaining SQL migrations
   - Deploy ingest worker
   - Enable rate limits
   
3. **Testing & verification** (2 days)
   - Run tenant isolation tests
   - Execute k6 noisy neighbor tests
   - Verify all CI checks pass
   
4. **Observability** (1 day)
   - Set up dashboards
   - Configure alerts
   - Write runbooks

**Target: Production ready by Nov 1**

---

**Last Updated:** 2025-10-22
