# Yalls Production Runbook & Investor Demo Guide

## Fast Acceptance Checklist

### ✅ 1. Build & Type Safety
```bash
# Run these commands to verify
pnpm typecheck          # Should pass with 0 errors
pnpm build             # Should complete successfully
pnpm test:e2e          # Playwright smoke tests (all green)
```

**Expected Output:**
- No TypeScript errors
- Build completes in < 60s
- All core routes accessible

---

### ✅ 2. Environment Variables

#### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://xuxfuonzsfvrirdwzddt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_REDIS_URL=rediss://default:password@host:port  # Optional for frontend
VITE_SENTRY_DSN=https://...                          # Optional
VITE_COMMIT_SHA=abc123                               # Optional
```

#### Worker (.env.worker)
```bash
SUPABASE_URL=https://xuxfuonzsfvrirdwzddt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # CRITICAL: Service role only
REDIS_URL=rediss://default:password@host:port
JOBS_QUEUE=jobs:main
STORAGE_BUCKET=exports
SENTRY_DSN_WORKER=https://...         # Optional
```

**Verify:** All keys are set and valid (test with a simple query)

---

### ✅ 3. Redis & Worker Health

#### Test Redis Connectivity
```bash
# From your Redis CLI or Upstash console
PING  # Should return PONG
```

#### Test Worker
```bash
# Start worker
node dist/workers/index.js

# Expected log output:
# [Worker] online; queue: jobs:main
```

#### Health Endpoint
```bash
curl http://localhost:5173/health

# Expected response:
{
  "ok": true,
  "timestamp": "2025-01-...",
  "services": {
    "database": "up",
    "redis": "configured",
    "worker": "online"
  }
}
```

---

### ✅ 4. Feed Cache Sanity

**Test Cache Hits:**
1. Open DevTools Network tab
2. Navigate to `/` (Home)
3. First load: RPC call to `feed_fusion_home` (300-500ms)
4. Refresh within 60s: Instant load from Redis cache (<50ms)

**Verify Redis Keys:**
```bash
# In Redis CLI
KEYS feed:*

# Should show:
# feed:home:user-uuid:personal
# feed:home:user-uuid:combined
# feed:profile:entity-uuid:this
```

**Check TTL:**
```bash
TTL feed:home:user-uuid:personal
# Should return 40-60 (seconds remaining with jitter)
```

---

### ✅ 5. Telemetry Guard Rails

**Test Telemetry:**
1. Navigate: `/` → `/discover` → `/dashboard`
2. Check Supabase `usage_events` table
3. Should see rows with:
   - `event_type`: `page_view`, `dwell_end`
   - `duration_ms`: >0 for dwell_end
   - `user_id`: your UUID (or null if anon)

**Verify Guards:**
- No errors if user is anonymous
- No errors in SSR (if applicable)
- `crypto.randomUUID()` fallback works in older browsers

---

### ✅ 6. CSV Export End-to-End

**Test Full Flow:**
```bash
# 1. Enqueue job
export DEMO_USER_ID=your-user-uuid
node -r esbuild-register scripts/demo-enqueue.ts

# Expected: "enqueued csv_export"
```

**Verify:**
1. Worker logs show job processing
2. Supabase Storage `exports` bucket has new CSV file
3. `notifications` table has row with:
   - `lane`: `exports`
   - `payload.kind`: `csv_ready`
   - `payload.url`: signed URL (expires in 24h)
4. UI shows notification in `/messages` → Notifications tab

---

### ✅ 7. TikTok Gestures UX

**Test Gestures:**
- **Mobile:** Swipe up/down on Home feed → Next/prev reel loads
- **Desktop:** Click + drag up/down → Next/prev reel loads
- **iOS:** No rubber-band "click-through" on overscroll
- **Android:** Smooth snap behavior

**CSS Verification:**
```css
/* Should be in index.css */
html, body { overscroll-behavior-y: none; }
#app, .tiktok-panel { scroll-snap-type: y mandatory; }
```

---

### ✅ 8. Demo Seeds

**Run Seed Script:**
```sql
-- In Supabase SQL Editor
-- Run: supabase/seed-demo.sql
```

**Verify Seeded Data:**
- Home feed shows: Post, Listing, Event (mixed)
- Dashboard → Earnings shows tier capture percentages
- Dashboard → Incentives shows at least 1 program
- Messages → Notifications has 2+ mock events

---

## "Investor Mode" Settings

### Feature Flags (Enable All)
```typescript
// In sessionStorage or DB feature_flags table
{
  "rocker_always_on": true,      // AI suggestions everywhere
  "payments_real": false,         // Mock payments only (safe)
  "discover_reels": true,         // TikTok-style discover
  "feed_shop_blend": true         // Posts + Listings + Events
}
```

### Optional: Demo Mode Query Param
Add `?demo=1` to URLs for:
- Force cached demo data
- Show capture-rate CTA prominently
- Ensure at least one "CSV ready" notification

---

## Five-Minute Pitch Script

**Goal:** Show end-to-end flow with no dead ends

### 1. Home Feed (30 seconds)
- Open `/` 
- **Swipe 2-3 reels** → Show smooth gestures
- Point out: "Posts, listings, and events blended by AI ranking"

### 2. Add to Cart (30 seconds)
- Tap a **ListingCard**
- Click **"Add to Cart"**
- Swipe feed → That listing no longer appears (cart suppression working)

### 3. Dashboard Overview (60 seconds)
- Navigate to `/dashboard`
- **Overview tab** → Show "Next Best Actions" panel
  - "List your first item"
  - "Claim your entity"
  - "Complete profile"

### 4. Earnings (45 seconds)
- **Earnings tab** → Show:
  - Capture %: 1% (Free), 2.5% (T1), 4% (T2)
  - Missed earnings last 30d: $X,XXX
  - Upgrade CTA button

### 5. CSV Export (45 seconds)
- Click **"Export CSV"** (or trigger via script)
- Switch to `/messages`
- Show **"CSV ready"** notification with signed URL
- Click URL → CSV downloads

### 6. Incentive Programs (30 seconds)
- Dashboard → **Incentives tab**
- Click **"Create Program"** (producer-gated)
- Fill form → Success toast
- Program appears in list

### 7. Health Endpoint (20 seconds)
- Open new tab: `/health`
- Show JSON: `{ ok: true, redis: "configured", db: "up" }`

### 8. Feature Flags (20 seconds)
- Open DevTools console
- Toggle flag: `sessionStorage.setItem('ff_shop_blend', 'false')`
- Refresh → Feed shows posts only (dark launch capability)

**Total: ~5 minutes**

---

## Security Quick Proof (For Q&A)

### Payment Security
- **Stage:** `payments_real=false` → No real PAN ever touches system
- **Prod:** PSP tokenization only (Stripe Elements)
- **Refunds/Payouts:** Worker-only with service key, all logged

### Data Access
- **RLS:** Every table has row-level security
- **Writes:** Sensitive operations via `SECURITY DEFINER` RPCs only
- **Auth:** All requests include `auth.uid()` in DB context

### Rate Limiting
- **Redis:** Token bucket per user/IP
- **DB:** `check_rate_limit()` proc called in hot RPCs
- **WAF:** Cloudflare rules at edge (100 req/min/IP on `/rpc/*`)

### Operations
- **Errors:** Sentry (both frontend + worker)
- **Monitoring:** Health endpoint + OpenTelemetry (RPCs)
- **Jobs:** Background workers isolated, retries + DLQ
- **Secrets:** Never shipped to browser (service key worker-only)

---

## Scaling Posture (10M → 1B Users)

### Current Architecture (10M users)
- **Feed:** Redis cache (60-120s TTL), server-side blend/caps
- **DB:** Indexed on `created_at`, `entity_id`, `user_id`
- **Workers:** Async exports, notifications, retries

### Next Scale Switches (No Code Rewrite)
1. **Read Replicas:** Supabase read-only followers for RPCs
2. **Redis Cluster:** Upstash multi-zone or managed cluster
3. **CDN:** Cache anonymous discover feed at edge
4. **Partitioning:** Time-based for `usage_events`, `notifications`
5. **TTL:** Auto-expire log tables after 90d
6. **Idempotency:** Keys on write RPCs + worker jobs

### Capacity Targets (1B users)
- **Feed RPS:** 100K (Redis cache hit rate >90%)
- **Write RPS:** 10K (Supabase can handle 50K+)
- **Worker Jobs:** 1M/day (horizontal scale workers)
- **Storage:** 10TB (Supabase auto-scales)

---

## Final Hardening (Quick Wins)

### Dead Letter Queue (DLQ)
```typescript
// In worker: if job fails 3x, move to jobs:dead
if (retries >= 3) {
  await rpush('jobs:dead', { ...job, error: e.message });
}
```

### Idempotency Keys
```typescript
// Check before enqueue
const key = `job:${job.type}:${job.userId}:${Date.now()}`;
if (await rget(key)) return; // Already enqueued
await rset(key, 1, 300); // 5min TTL
await enqueue(job);
```

### Worker Sentry
```typescript
// In workers/index.ts
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN_WORKER });
```

### Admin Health Page
```typescript
// Create /admin/health route (role-gated)
// Show: DB status, Redis status, Worker queue depth, Recent errors
```

### Cloudflare Rules (Verify)
- ✅ Bot Fight Mode: On
- ✅ Rate Limits: `/rpc/*` (100/min), `/auth/*` (20/min)
- ✅ Cache: `/assets/*` (1y TTL)

---

## Go/No-Go Checklist

**Before Investor Demo:**
- [ ] All acceptance tests pass (1-8 above)
- [ ] Demo seeds loaded
- [ ] Feature flags enabled
- [ ] Health endpoint returns `ok: true`
- [ ] Worker running and processing jobs
- [ ] Redis cache hit rate >50%
- [ ] Telemetry logging page views
- [ ] CSV export → notification flow works
- [ ] Gestures smooth on mobile device

**Before Production Deploy:**
- [ ] All acceptance tests pass
- [ ] Load test: `k6 run loadtest.js` (p95 < 300ms)
- [ ] Sentry configured (frontend + worker)
- [ ] Cloudflare rules live
- [ ] Monitoring dashboards set up
- [ ] On-call rotation scheduled
- [ ] Rollback plan documented

---

## Emergency Contacts

**If Demo Breaks:**
1. Check `/health` endpoint first
2. Check worker logs: `[Worker] error`
3. Check Redis connectivity: `redis-cli PING`
4. Fallback: Disable feature flags, show static demo data

**If Production Breaks:**
1. Scale down worker to 0 (stops async jobs)
2. Disable feature flags (falls back to posts-only feed)
3. Check Sentry for error spike
4. Roll back frontend to previous version
5. Redis cache auto-expires in 60-120s

---

## Success Metrics

**Investor Demo:**
- ✅ No 404s or error pages
- ✅ Feed loads in <1s
- ✅ Gestures feel native
- ✅ CSV export completes in <10s
- ✅ All 8 pitch steps complete without refresh

**Production:**
- p95 latency < 300ms
- Error rate < 1%
- Cache hit rate > 90%
- Worker job success rate > 99%
- Zero data breaches

---

**🚀 Ready to ship!**
