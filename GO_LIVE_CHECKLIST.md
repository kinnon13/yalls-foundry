# Go-Live Checklist for Yalls

## ✅ What's Been Completed (Code-Ready)

### Infrastructure Files
- [x] `src/lib/redis.ts` - Redis client with jitter, type safety, and `hasRedis()` helper
- [x] `src/lib/supabaseAdmin.ts` - Service role client for workers (server-only)
- [x] `src/lib/feedCache.ts` - Typed feed cache with TTL (60-120s)
- [x] `src/lib/gestures.ts` - TikTok-style swipe with iOS fixes
- [x] `src/lib/telemetry.ts` - Page view tracking with SSR guards and crypto fallback

### Worker Infrastructure
- [x] `workers/index.ts` - Idempotent job loop (never dies)
- [x] `workers/util-enqueue.ts` - Queue helper with JOBS_QUEUE env
- [x] `workers/handlers/csv_export.ts` - CSV generation with Buffer/Blob fallback
- [x] `workers/handlers/notif.ts` - Notification sender via RPC

### Type Definitions
- [x] `src/types/feed.ts` - `FeedItemKind`, `FeedItemBase`, union types
- [x] `src/types/rpc.ts` - `FusionFeedItem` RPC response type

### Demo & Documentation
- [x] `supabase/seed-demo.sql` - Investor demo seed data
- [x] `scripts/demo-enqueue.ts` - Test CSV export job
- [x] `RUNBOOK.md` - Complete production runbook with acceptance tests
- [x] `DEMO_SCRIPT.md` - 5-minute investor pitch script
- [x] `GO_LIVE_CHECKLIST.md` - This file
- [x] `README.production.md` - Deployment guide

### UI Components
- [x] `src/pages/Health.tsx` - `/health` endpoint UI with live status
- [x] `src/index.css` - TikTok scroll-snap CSS + overscroll fix
- [x] `src/App.tsx` - Health route added

---

## 🔧 What You Need to Do Manually

### 1. Install Dependencies (if not already)
```bash
pnpm install
# or
npm install
```

### 2. Set Environment Variables

#### Frontend (`.env`)
```bash
VITE_SUPABASE_URL=https://xuxfuonzsfvrirdwzddt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_REDIS_URL=rediss://default:password@host:port  # Optional for frontend
VITE_SENTRY_DSN=https://...@sentry.io/...           # Optional
VITE_COMMIT_SHA=main                                # Optional
```

#### Worker (`.env.worker` or separate config)
```bash
SUPABASE_URL=https://xuxfuonzsfvrirdwzddt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # CRITICAL: Service role
REDIS_URL=rediss://default:password@host:port
JOBS_QUEUE=jobs:main
STORAGE_BUCKET=exports
SENTRY_DSN_WORKER=https://...@sentry.io/...  # Optional
```

**⚠️ IMPORTANT:** Never commit `.env` files to git! Add to `.gitignore`.

### 3. Set Up Redis (Upstash)
1. Sign up at [https://upstash.com](https://upstash.com)
2. Create a new Redis database (select region closest to your users)
3. Enable TLS
4. Copy the `rediss://` URL
5. Set as `VITE_REDIS_URL` (frontend) and `REDIS_URL` (worker)

### 4. Create Storage Bucket in Supabase
```sql
-- Run this in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false);

-- RLS policy for exports
CREATE POLICY "Users can view own exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Verify Database RPCs Exist
Check these exist in Supabase:
- [ ] `feed_fusion_home(p_user_id uuid, p_mode text)`
- [ ] `feed_fusion_profile(p_entity_id uuid, p_mode text)`
- [ ] `notif_send(p_user_id uuid, p_lane text, p_payload jsonb)`
- [ ] `notif_mark_read(p_ids uuid[])`
- [ ] `notif_mark_all_read(p_lane text)`
- [ ] `log_usage_event_v2(...)`
- [ ] `earnings_preview(...)`

**If missing:** You'll need to create these via migrations (see `RUNBOOK.md`)

### 6. Run Type Check & Build
```bash
pnpm typecheck  # Should pass with 0 errors
pnpm build      # Should complete successfully
```

**Expected:** No TypeScript errors, build completes in <60s

### 7. Start Worker Locally
```bash
# Build first
pnpm build

# Start worker
node dist/workers/index.js

# Expected log:
# [Worker] online; queue: jobs:main
```

**Keep this running in a separate terminal**

### 8. Test the App Locally
```bash
pnpm dev
```

Open `http://localhost:5173`:
- [ ] Home page loads
- [ ] `/health` shows green status
- [ ] No console errors

### 9. Test Feed Cache
1. Open DevTools Network tab
2. Navigate to `/` (Home)
3. First load: RPC call to `feed_fusion_home` (slow)
4. Refresh within 60s: Should be instant (Redis cache hit)

**Verify in Redis CLI:**
```bash
redis-cli -u $REDIS_URL
> KEYS feed:*
# Should show: feed:home:..., feed:profile:...
> TTL feed:home:user-uuid:personal
# Should return 40-60 seconds
```

### 10. Test CSV Export End-to-End
```bash
# Set your user ID
export DEMO_USER_ID=your-user-uuid-here

# Run enqueue script
node -r esbuild-register scripts/demo-enqueue.ts

# Expected: "enqueued csv_export"
```

**Verify:**
1. Worker logs show job processing
2. Supabase Storage → `exports` bucket has new CSV
3. `notifications` table has row with `lane='exports'`
4. UI at `/messages` shows notification

### 11. Load Demo Seeds (For Investor Demo)
```bash
# In Supabase SQL Editor, run:
# supabase/seed-demo.sql
```

**Creates:**
- 1 entity (Bluegrass Farm)
- 1 post with image
- 1 listing ($125,000 filly)
- 1 event (Open Barn Morning)

### 12. Run Acceptance Tests (from RUNBOOK.md)
- [ ] Build & type safety (`pnpm typecheck && pnpm build`)
- [ ] Redis & worker health (see worker logs + `/health`)
- [ ] Feed cache sanity (first slow, second fast)
- [ ] Telemetry logs (`usage_events` table)
- [ ] CSV export end-to-end (notification appears)
- [ ] TikTok gestures (swipe up/down works)
- [ ] Demo seeds (feed shows mixed content)

---

## 🚀 Deploy to Production

### Option A: Vercel (Frontend) + Railway (Worker)

#### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set env vars in Vercel dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_REDIS_URL (optional)
# - VITE_SENTRY_DSN (optional)
```

#### Railway (Worker)
1. Sign up at [https://railway.app](https://railway.app)
2. Create new project → "Deploy from GitHub"
3. Select your repo
4. Set start command: `node dist/workers/index.js`
5. Add env vars:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL`
   - `JOBS_QUEUE=jobs:main`

### Option B: Render (All-in-One)

#### Frontend (Static Site)
- Build command: `pnpm build`
- Publish directory: `dist`
- Add env vars (same as Vercel)

#### Worker (Background Worker)
- Build command: `pnpm build`
- Start command: `node dist/workers/index.js`
- Add env vars (same as Railway)

---

## 🔒 Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set ONLY on worker (never frontend)
- [ ] RLS enabled on all tables
- [ ] Sensitive writes via `SECURITY DEFINER` RPCs only
- [ ] Rate limits configured (see `RUNBOOK.md`)
- [ ] Cloudflare rules applied (cache + WAF)
- [ ] CORS restricted to your domain (production only)
- [ ] Secrets in `.env` files (never committed to git)

---

## 🎯 Feature Flags (For Demo)

Enable these for investor demo:
```typescript
// In sessionStorage or DB
{
  "rocker_always_on": true,      // AI suggestions everywhere
  "payments_real": false,         // Mock payments only (safe)
  "discover_reels": true,         // TikTok-style discover
  "feed_shop_blend": true         // Posts + Listings + Events
}
```

**To test:**
```javascript
// In browser console
sessionStorage.setItem('ff_shop_blend', 'false');
location.reload(); // Feed shows posts only
```

---

## 📊 Success Metrics

### Before Demo:
- [ ] `/health` returns `ok: true`
- [ ] Worker logs: `[Worker] online`
- [ ] Redis keys exist: `KEYS feed:*`
- [ ] Feed loads in <1s (first), <100ms (cached)
- [ ] CSV export completes in <10s
- [ ] No console errors on any route

### Production:
- [ ] p95 latency < 300ms
- [ ] Error rate < 1%
- [ ] Cache hit rate > 90%
- [ ] Worker job success rate > 99%
- [ ] Uptime > 99.9%

---

## 🆘 Troubleshooting

### Worker won't start
```bash
# Check env vars
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $REDIS_URL

# Check Redis connectivity
redis-cli -u $REDIS_URL PING  # Should return PONG
```

### Feed is slow
- Check Redis: `redis-cli -u $REDIS_URL KEYS feed:*`
- Check RPC duration in Supabase logs
- Verify indexes exist on `created_at`, `entity_id`

### CSV export fails
- Check worker logs for errors
- Verify `exports` bucket exists in Supabase Storage
- Check RLS policies on `storage.objects`

### Type errors
```bash
# Regenerate Supabase types
npx supabase gen types typescript --project-id xuxfuonzsfvrirdwzddt > src/integrations/supabase/types.ts

# Re-run typecheck
pnpm typecheck
```

---

## 📚 Next Steps

1. ✅ Complete manual steps above (1-12)
2. ✅ Run acceptance tests from `RUNBOOK.md`
3. ✅ Practice demo script from `DEMO_SCRIPT.md`
4. ✅ Deploy to staging environment
5. ✅ Run load test: `k6 run loadtest.js`
6. ✅ Configure monitoring (Sentry, Uptime Robot)
7. ✅ Deploy to production
8. ✅ Schedule investor demo

---

## 🎉 You're Production-Ready!

All code is in place. Follow the manual steps above, run the acceptance tests, and you're good to go live.

**Need help?** See `RUNBOOK.md` for detailed troubleshooting.

**Questions?** File an issue or reach out to the team.

---

*Built with ❤️ for the equestrian industry* 🐎
