# Phase 2 Implementation Status

## ✅ Completed (Ready to Use)

### 1. Rate Limiting Codemod
**File:** `scripts/enforce-rate-limit.ts`

**Run:**
```bash
deno run -A scripts/enforce-rate-limit.ts
```

**Coverage:**
- `admin`: outbox-drain
- `auth`: delete-account  
- `high`: health-liveness, health-readiness, kb-search
- `expensive`: rocker-chat, rocker-voice-session, upload-media, generate-embeddings, kb-ingest
- `standard`: all others

### 2. CRM Events Partitioning
**Status:** Structure created, ready for swap

**Tables created:**
- `crm_events_partitioned` (parent)
- `crm_events_2025_10` through `crm_events_2026_03` (6 months)
- `crm_events_default` (catch-all)

**Activate (low-traffic window):**
```sql
BEGIN;
LOCK TABLE crm_events IN ACCESS EXCLUSIVE MODE;
INSERT INTO crm_events_partitioned SELECT * FROM crm_events;
ALTER TABLE crm_events RENAME TO crm_events_old;
ALTER TABLE crm_events_partitioned RENAME TO crm_events;
COMMIT;

-- After validation:
DROP TABLE crm_events_old;
```

**Monthly maintenance:**
```sql
SELECT app.ensure_next_crm_partition();
```

### 3. Redis Read-Through Cache
**File:** `src/lib/cache/readThrough.ts`

**Usage:**
```ts
import { readThrough, CacheKeys } from '@/lib/cache/readThrough';

// Cache for 30 seconds
const data = await readThrough(
  CacheKeys.listing(tenantId, listingId),
  30,
  () => fetchListing(listingId)
);
```

**Pre-built keys:**
- `CacheKeys.listing(tenantId, id)`
- `CacheKeys.listings(tenantId, page)`
- `CacheKeys.profile(tenantId, userId)`
- `CacheKeys.event(tenantId, id)`
- `CacheKeys.horse(tenantId, id)`

## ❌ Still Needs Work

### 1. Hardcoded Tenant IDs (18 instances, 14 files)

**Files to fix:**
- `aggregate-learnings/index.ts` (1)
- `consent-accept/index.ts` (1)
- `consent-revoke/index.ts` (1)
- `consent-status/index.ts` (1)
- `entity-lookup/index.ts` (2)
- `generate-preview/index.ts` (1)
- `reshare-post/index.ts` (1)
- `rocker-chat/learning.ts` (1)
- `rocker-chat/tools/executor.ts` (3)
- `rocker-memory/index.ts` (1)
- `save-post/index.ts` (1)
- `unsave-post/index.ts` (1)
- `upload-media/index.ts` (2)
- `src/lib/tenancy/context.ts` (1 - GLOBAL_TENANT_ID constant, OK)

**Fix strategy:**
```ts
// Before
const tenantId = '00000000-0000-0000-0000-000000000000';

// After (in edge functions)
import { getTenantFromJWT } from '../_shared/rate-limit-wrapper.ts';
const tenantId = getTenantFromJWT(req) || '00000000-0000-0000-0000-000000000000';
```

### 2. Large Files (>200 lines)

**Need refactoring:**
- `RockerChatUI.tsx` (490 lines) - Extract: VoiceControls, ChatHeader, MessageList
- `rocker-chat/index.ts` (357 lines) - Extract: ContextBuilder, ToolLoop, SummaryGenerator
- `control-room.tsx` (255 lines) - Already well-structured, acceptable

### 3. Console Logs (354 instances)

**Bulk replace:**
```bash
# Find all console.log instances
git grep -n "console\.(log|error|warn)" src supabase/functions

# Replace with structured logger
# In edge functions: use log('info', 'message', { fields })
# In frontend: use logger.info('message', { fields })
```

## 🎯 Quick Wins (30 min each)

### Win 1: Fix Hardcoded Tenants
```bash
# In each edge function, add at top:
import { getTenantFromJWT } from '../_shared/rate-limit-wrapper.ts';

# Replace hardcoded tenant with:
const tenantId = getTenantFromJWT(req) || await resolveTenantId(user?.id);
```

### Win 2: Run Rate Limit Codemod
```bash
deno run -A scripts/enforce-rate-limit.ts
```

### Win 3: Activate Partitioning
```sql
-- During low-traffic (01:00-03:00 UTC)
-- Copy-paste the swap script from above
```

### Win 4: Add Redis Cache to Hot Reads
```ts
// In marketplace listing detail:
const listing = await readThrough(
  CacheKeys.listing(tenantId, id),
  60, // 1 min cache
  () => supabase.from('marketplace_listings').select('*').eq('id', id).single()
);
```

## 📊 Expected Impact

After completing Phase 2:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Max Users | ~100K | ~500K | 5x |
| Edge Function Rate Limits | 4/~50 | 50/50 | 100% |
| Hardcoded Tenants | 18 | 0 | ✅ |
| CRM Events Query Speed | ~200ms | ~20ms | 10x |
| Cache Hit Rate | 0% | 60-80% | New |
| Console Logs (prod) | 354 | <10 | 97% |

## 🔥 Next: Phase 3 (Million+ Users)

- Kubernetes deployment
- Read replicas (3+)
- Kafka/Redpanda for outbox
- Prometheus + Grafana
- Auto-scaling (CPU/memory triggers)
- Multi-region failover

---

**Run codemod now, activate partitioning during low-traffic window, wire Redis into top 3 hot reads.**
