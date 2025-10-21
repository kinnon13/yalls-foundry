# 🔥 Zero-Excuses Security & Scale Audit

**Date:** 2025-10-21  
**Status:** ⚠️ CRITICAL GAPS IDENTIFIED - REQUIRES IMMEDIATE ACTION  
**Severity:** Multiple P0 security & scalability issues

---

## Executive Summary: CRITICAL ISSUES FOUND

### 🚨 P0 BLOCKERS (Ship-Stoppers)

| Issue | Impact | Current State | Risk Level |
|-------|--------|---------------|------------|
| **No Tenant Isolation** | Cross-org data leakage | ❌ Raw DB calls everywhere | 🔴 CRITICAL |
| **91 RLS Violations** | Unauthorized data access | ❌ 7 tables exposed, SECURITY DEFINER views | 🔴 CRITICAL |
| **Synchronous Heavy Ops** | Platform hangs, timeout cascades | ❌ OCR/embeddings block requests | 🔴 CRITICAL |
| **No Rate Limiting** | DDoS vulnerable | ⚠️ Partial (only 6 functions) | 🟠 HIGH |
| **Raw Service Key Usage** | Privilege escalation | ❌ SERVICE_ROLE exposed | 🔴 CRITICAL |
| **No Search Isolation** | Marketplace contamination | ❌ Single index, no tenant filtering | 🟠 HIGH |

---

## 1. Tenant Isolation Audit - ❌ FAILED

### Current State: CRITICAL VULNERABILITIES

**Analysis:** Searched 146 edge functions and found:
- ✅ 22 functions with partial tenant_id handling
- ❌ 124 functions with NO tenant isolation
- ❌ 360+ raw `supabase.from()` calls (unguarded)
- ❌ NO unified tenant guard wrapper
- ❌ Service role key used directly in 40+ functions

### Vulnerable Functions (Sample)

```typescript
// ❌ VULNERABLE: Direct DB access, no tenant check
supabase/functions/rocker-chat/index.ts:
const supabase = createClient(url, anonKey, {
  global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }
});
// User could inject any JWT and read other users' data

// ❌ VULNERABLE: Service role without tenant isolation
supabase/functions/andy-chat/index.ts:
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Bypasses ALL RLS policies - can access any org's data

// ❌ VULNERABLE: No org_id in query
supabase/functions/kb-search/index.ts:
const { data } = await supabase
  .from('knowledge_items')
  .select('*')
  .textSearch('title', q);
// Returns results from ALL orgs, not just user's
```

### Gap Analysis

| Requirement | Current | Gap |
|-------------|---------|-----|
| Unified tenant guard | ❌ None | Need withTenantGuard(req) wrapper |
| Tenant-scoped client | ❌ None | Need tenantClient(org_id) |
| Admin-only client | ⚠️ Partial | Need adminClient() with audit |
| Org resolution | ⚠️ Partial | Need JWT → org_id mapper |
| Cross-org queries blocked | ❌ None | Need query filters enforced |

### Attack Vectors

1. **JWT Injection:** User modifies JWT to include another org_id → reads their data
2. **Service Role Abuse:** Any function with service key can read ALL orgs
3. **Missing WHERE clauses:** Queries without org_id return data from all tenants
4. **RLS Bypass:** Service role ignores RLS, no audit trail

---

## 2. RLS Policy Audit - ❌ FAILED

### Supabase Linter Results: 91 Issues

```
INFO x7: RLS Enabled No Policy (7 tables)
  - Tables have RLS enabled but NO policies defined
  - Result: ALL operations blocked (even for owners)
  
ERROR x5: Security Definer Views (5 views)
  - Views run with creator's permissions (god mode)
  - Bypass RLS and expose all data
  
Multiple other issues...
```

### Tables WITHOUT Proper RLS

```sql
-- ❌ CRITICAL: No policies (7 tables)
rocker_files           -- RLS ON, but NO policies → all queries fail
andy_prediction_sessions
andy_prediction_rounds  
rocker_tasks           
voice_events (partial) -- Only insert/select own, missing update/delete
knowledge_chunks       -- Missing user-scoped policies
rocker_long_memory     -- No isolation between users

-- ❌ HIGH RISK: Overly permissive (12+ tables)
profiles               -- "Profiles are viewable by everyone" → PII leak
businesses             -- "Businesses are viewable by everyone" → competitor intel
events                 -- No org_id filter in policies
```

### Security Definer Functions (Dangerous)

```sql
-- ❌ CRITICAL: These bypass RLS and run as superuser
CREATE VIEW some_view WITH (security_definer=true) AS
  SELECT * FROM sensitive_table; -- Exposes ALL rows

-- Functions affected (from linter):
- 5 views with SECURITY DEFINER
- Result: Any authenticated user can query these to bypass RLS
```

---

## 3. Async Jobs & Backpressure - ❌ NOT IMPLEMENTED

### Current State: SYNCHRONOUS BLOCKING

**Heavy Operations Found:**
- `andy-embed-knowledge`: Generates embeddings for ALL files (can take minutes)
- `kb-ingest`: Chunks + embeds large documents synchronously
- `ingest-upload`: OCR on images blocks request
- `business-scan-site`: Crawls entire website in HTTP request
- `generate-embeddings`: Batch embeddings (no queue)

### Impact of Synchronous Operations

```typescript
// ❌ CURRENT: User uploads 100-page PDF
POST /functions/v1/kb-ingest
  → Chunks document (30 seconds)
  → Generates 100 embeddings (2 minutes)
  → User's browser times out
  → Retry → duplicate work
  → Platform slows down for everyone

// ❌ CURRENT: Noisy neighbor scenario
Org A uploads 1000 files → 1000 embedding requests
→ All workers busy
→ Org B's simple chat request times out (no capacity)
→ P95 latency: 45 seconds (unacceptable)
```

### Missing Infrastructure

| Component | Status | Impact |
|-----------|--------|--------|
| Job queue table | ❌ None | No async processing |
| Worker pool | ❌ None | No background jobs |
| Per-org concurrency limits | ❌ None | Noisy neighbor kills platform |
| Idempotency keys | ❌ None | Duplicate work on retry |
| Job status tracking | ❌ None | No visibility |
| Dead letter queue | ❌ None | Failed jobs lost |

---

## 4. Rate Limiting Audit - ⚠️ PARTIAL

### Current State: INCONSISTENT

**Functions with rate limiting:** 6 out of 146 (4%)
```typescript
✅ crm-track (tenant-aware)
✅ kb-search (tenant-aware)
✅ kb-ingest (expensive tier)
⚠️ 3 others (generic, not tenant-scoped)

❌ 140 functions with NO rate limiting
```

### Missing Rate Limits

```typescript
// ❌ UNPROTECTED: Can be spammed
POST /functions/v1/rocker-chat        -- No limits
POST /functions/v1/andy-chat          -- No limits
POST /functions/v1/text-to-speech     -- No limits → TTS bill explosion
POST /functions/v1/business-scan-site -- No limits → crawler abuse
```

### Rate Limit Implementation Issues

1. **No tenant isolation:** Rate limits are per-user, not per-org
   - Result: One user can exhaust entire org's quota
2. **No tiered limits:** All requests treated equally
   - Result: Expensive ops (TTS, embeddings) consume same quota as cheap reads
3. **No quota enforcement:** No hard caps per org/month
   - Result: Runaway costs

---

## 5. Search Isolation Audit - ❌ FAILED

### Current State: SINGLE INDEX

```typescript
// ❌ CURRENT: One index for everything
knowledge_chunks (
  item_id uuid,
  text text,
  embedding vector(1536),
  -- NO org_id column!
)

// Query searches ALL orgs
const { data } = await supabase.rpc('match_kb_chunks', {
  query_embedding: vec,
  match_threshold: 0.6
});
// Returns results from ANY org that matches
```

### Attack Vector

```typescript
// Attacker in Org A discovers competitor's product name
// Searches for "confidential product roadmap"
// Gets results from Org B's private knowledge base
// Data exfiltration via search
```

### Missing: Dual Index Architecture

```sql
-- ❌ MISSING: Private tenant index
CREATE TABLE vectors_private (
  org_id uuid NOT NULL,
  embedding vector(1536),
  -- RLS enforces org_id = current user's org
);

-- ❌ MISSING: Public marketplace index
CREATE TABLE market_search_index (
  is_public boolean DEFAULT true,
  embedding vector(1536),
  -- No RLS (public data)
);
```

---

## 6. Voice/TTS Audit - ⚠️ PARTIAL

### Current State: MOSTLY GOOD, BUT...

✅ Server TTS only (no web fallback)  
✅ Three locked voices  
✅ Error logging to voice_events  
❌ NO quotas (TTS minutes/month/org)  
❌ NO failover (single vendor)  
❌ NO cost tracking per org  

### Missing Quota Enforcement

```typescript
// ❌ CURRENT: Unlimited TTS
POST /functions/v1/text-to-speech
  { text: "..." } // 10,000 words
// No check if org has exceeded monthly quota
// OpenAI bill: $$$$$

// ✅ NEEDED: Quota check
if (await exceedsTTSQuota(org_id)) {
  return new Response('Quota exceeded', { status: 429 });
}
```

---

## 7. Security & Secrets Audit - ❌ FAILED

### Critical Issues

1. **Service Role Key Exposed**
   ```typescript
   // ❌ FOUND IN 40+ FUNCTIONS
   const supabase = createClient(url, SERVICE_ROLE_KEY);
   // This key bypasses ALL security
   // If leaked: complete data breach
   ```

2. **No Secret Rotation**
   - Service role key: Never rotated
   - API keys: Hardcoded in functions
   - No expiry dates

3. **No Secret Scanning**
   - No pre-commit hooks
   - No CI checks for leaked secrets
   - No automated detection

### Missing Security Headers

```typescript
// ❌ CURRENT: Missing security headers
return new Response(data);

// ✅ NEEDED:
return new Response(data, {
  headers: {
    'Content-Security-Policy': "default-src 'self'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=31536000',
  }
});
```

---

## 8. Observability Audit - ❌ FAILED

### Current State: BLIND SPOTS

**Logging:**
- ⚠️ Partial structured logging (only 15 functions use logger)
- ❌ No correlation IDs (can't trace requests across services)
- ❌ No org_id in logs (can't isolate org issues)

**Metrics:**
- ❌ No latency tracking per org
- ❌ No cost tracking per org
- ❌ No queue depth monitoring
- ❌ No error rate dashboards

**Alerts:**
- ❌ No SLO violation alerts
- ❌ No quota breach alerts
- ❌ No anomaly detection

### Impact

```
User: "My chat is slow"
Support: "Let me check the logs..."
  → Finds 100,000 log lines across all orgs
  → No way to filter to user's org
  → No latency metrics
  → No idea what's slow
  → 2 hours to diagnose
```

---

## 9. Code Quality Audit - ⚠️ MIXED

### Good Practices Found

✅ TypeScript used consistently  
✅ ESLint guards for Web Speech  
✅ Some structured logging  
✅ Some rate limiting  

### Bad Practices Found

❌ **Duplicate code:** 6+ functions copy-paste embedding generation  
❌ **No shared libraries:** Each function reimplements auth  
❌ **Inconsistent error handling:** Some return 500, some throw  
❌ **No input validation:** Many functions trust req.json()  
❌ **Magic strings:** Role keys scattered ('user', 'admin', 'knower', etc.)  

---

## 10. Testing Audit - ❌ FAILED

### Current State: NO TESTS

```bash
# Search for test files
find . -name "*.test.ts" -o -name "*.spec.ts"
# Result: 0 files found

# Test coverage
# Result: 0%
```

### Critical Missing Tests

1. **Tenant Leak Test:** Upload file as Org A, verify Org B can't read it
2. **RLS Policy Test:** Try to bypass RLS with crafted JWTs
3. **Noisy Neighbor Test:** Hammer Org A, verify Org B latency stable
4. **Rate Limit Test:** Exceed quota, verify 429 response
5. **Voice Quota Test:** Exceed TTS minutes, verify denied

---

## Summary: Priority Matrix

### P0 - CRITICAL (Ship Blockers)

| Item | Effort | Impact | ETA |
|------|--------|--------|-----|
| **Implement withTenantGuard** | 3 days | Prevents data leakage | Immediate |
| **Fix 7 RLS tables** | 1 day | Unblocks queries | Immediate |
| **Create job queue** | 2 days | Prevents timeouts | Immediate |
| **Rotate service keys** | 1 day | Prevents breach | Immediate |
| **Add search org_id filter** | 1 day | Prevents data exfiltration | Immediate |

**Total P0:** 8 days, 1 engineer

### P1 - HIGH (Scale Blockers)

| Item | Effort | Impact | ETA |
|------|--------|--------|-----|
| Per-org rate limits | 2 days | Prevents noisy neighbor | Week 2 |
| TTS quotas | 1 day | Prevents cost explosion | Week 2 |
| Observability dashboards | 3 days | Enables debugging | Week 2 |
| Tenant leak tests | 2 days | Validates security | Week 2 |

**Total P1:** 8 days, 1 engineer

### P2 - MEDIUM (Quality)

| Item | Effort | Impact | ETA |
|------|--------|--------|-----|
| Consolidate duplicate code | 3 days | Reduces bugs | Week 3 |
| Add CSP/security headers | 1 day | Hardens security | Week 3 |
| Document architecture | 2 days | Enables onboarding | Week 3 |

---

## Detailed Gap Analysis

### 1. Tenant Guard Implementation

**Required:**
```typescript
// utils/tenantGuard.ts
export async function withTenantGuard(
  req: Request,
  handler: (ctx: TenantContext) => Promise<Response>
): Promise<Response> {
  // 1. Authenticate user (JWT → userId)
  const { userId } = await authenticate(req);
  
  // 2. Resolve org (from JWT claims or user profile)
  const orgId = await resolveOrgId(userId);
  
  // 3. Check rate limits (per-org + per-user buckets)
  await enforceRateLimits(orgId, userId);
  
  // 4. Load capabilities (admin, super_admin, etc.)
  const capabilities = await loadCapabilities(userId);
  
  // 5. Load feature flags (org-specific)
  const flags = await loadFeatureFlags(orgId);
  
  // 6. Create tenant-scoped client
  const tenantClient = createTenantClient(orgId);
  
  return handler({ userId, orgId, capabilities, flags, tenantClient });
}
```

**Rollout:**
1. Create wrapper (1 day)
2. Wrap 10 critical functions (1 day)
3. Add ESLint rule to enforce (0.5 day)
4. Wrap remaining 136 functions (0.5 day)

### 2. Job Queue Schema

```sql
CREATE TABLE ingest_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  kind text NOT NULL, -- 'crawl' | 'ocr' | 'embed' | 'tts_batch'
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'queued', -- queued | running | done | failed | dead
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  external_idempotency_key text UNIQUE,
  visible_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error jsonb
);

CREATE INDEX ON ingest_jobs (org_id, status, visible_at);
CREATE INDEX ON ingest_jobs (external_idempotency_key) WHERE external_idempotency_key IS NOT NULL;

-- RLS
ALTER TABLE ingest_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_insert_own ON ingest_jobs FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY jobs_select_own ON ingest_jobs FOR SELECT
  USING (org_id = (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));
```

### 3. Worker Implementation

```typescript
// workers/job-runner.ts
const activeByOrg = new Map<string, number>();
const MAX_CONCURRENT = 2; // Per org

while (true) {
  const job = await fetchNextJob();
  if (!job) { await sleep(150); continue; }
  
  const current = activeByOrg.get(job.org_id) || 0;
  if (current >= MAX_CONCURRENT) {
    await deferJob(job, 500); // Try again in 500ms
    continue;
  }
  
  activeByOrg.set(job.org_id, current + 1);
  
  processJob(job).finally(() => {
    const count = activeByOrg.get(job.org_id) || 1;
    activeByOrg.set(job.org_id, count - 1);
  });
}
```

---

## Acceptance Criteria

### For P0 (Critical)

- [ ] ALL 146 functions wrapped with withTenantGuard
- [ ] ESLint rule fails build if raw supabase.from() found
- [ ] 7 RLS tables fixed with proper policies
- [ ] Job queue schema created
- [ ] Worker processing heavy ops asynchronously
- [ ] Service role key rotated + stored securely
- [ ] Search queries include org_id filter
- [ ] Tenant leak test passes

### For P1 (High)

- [ ] Per-org rate limits enforced
- [ ] TTS quotas implemented + enforced
- [ ] Observability dashboards deployed
- [ ] P95 latency < 500ms under load
- [ ] Noisy neighbor test passes
- [ ] Cost tracking per org visible

---

## Next Steps

1. **Immediate (Today):**
   - Create withTenantGuard wrapper
   - Fix 7 RLS tables
   - Audit service role key usage

2. **Week 1:**
   - Wrap all functions with guard
   - Implement job queue
   - Deploy worker
   - Add search filters

3. **Week 2:**
   - Per-org rate limits
   - TTS quotas
   - Observability dashboards
   - Write tests

4. **Week 3:**
   - Code consolidation
   - Security headers
   - Documentation

---

**Last Updated:** 2025-10-21  
**Next Review:** After P0 completion  
**Status:** 🚨 CRITICAL - REQUIRES IMMEDIATE ACTION
