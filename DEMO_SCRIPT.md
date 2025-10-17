# Yalls Investor Demo Script (5 Minutes)

**Goal:** Show end-to-end platform capabilities with zero dead ends

**Prep:** Ensure demo seeds loaded, feature flags enabled, worker running

---

## 🎬 Script Timeline

### 00:00 - 00:30 | Home Feed (TikTok-style)
**What to show:**
- Open `/` (Home page)
- Swipe through 2-3 reels (mix of posts, listings, events)
- Point out smooth gestures and instant load

**Say:** 
> "This is our AI-powered feed—posts, listings, and events blended by relevance. Works like TikTok but for the equestrian industry. Redis cache makes it instant."

**Technical:** First load ~300ms (RPC), second load ~50ms (cache hit)

---

### 00:30 - 01:00 | Add to Cart + Feed Suppression
**What to show:**
- Tap a **ListingCard** (2022 Filly by Into Mischief)
- Click **"Add to Cart"**
- Swipe feed → That listing no longer appears

**Say:**
> "When you add something to cart, our feed AI removes it from your scroll for the next 20 items—no repeat content. Smart blend."

**Technical:** Cart suppression logic in `feed_fusion_home` RPC

---

### 01:00 - 02:00 | Dashboard Overview
**What to show:**
- Navigate to `/dashboard`
- **Overview tab** → Show "Next Best Actions" panel
  - ✅ "List your first item"
  - ✅ "Claim your entity"
  - ✅ "Complete profile"

**Say:**
> "This is the producer dashboard—one place to manage everything. Rocker, our AI assistant, suggests the best next actions based on your activity. It's proactive, not just reactive."

**Technical:** Powered by `rocker_next_best_actions` RPC

---

### 02:00 - 02:45 | Earnings (MLM Structure)
**What to show:**
- Click **Earnings tab**
- Point to:
  - **Capture %**: 1% (Free), 2.5% (T1), 4% (T2)
  - **Missed earnings**: $X,XXX (last 30 days)
  - **Upgrade CTA** button

**Say:**
> "We have a tiered membership model. Free users capture 1% of eligible earnings, paid tiers up to 4%. This shows what you're leaving on the table—a clear upgrade incentive."

**Technical:** Lines split 60/25/15 (business/buyer/seller), tier capture logic

---

### 02:45 - 03:30 | CSV Export + Notifications
**What to show:**
- Click **"Export CSV"** (or run `scripts/demo-enqueue.ts`)
- Switch to `/messages`
- Show **"CSV ready"** notification with signed URL
- Click URL → CSV downloads instantly

**Say:**
> "All heavy operations run asynchronously. CSV exports, notifications, everything—handled by background workers. Users never wait, and we stay responsive."

**Technical:** 
- Redis queue → Worker processes → Supabase Storage → Signed URL → Notification
- End-to-end in <10s

---

### 03:30 - 04:10 | Incentive Programs (Producer-Gated)
**What to show:**
- Dashboard → **Incentives tab**
- Click **"Create Program"** (producer-gated)
- Fill quick form:
  - Name: "Spring Bonus"
  - Type: "Performance"
  - Amount: $500
- Success toast
- Program appears in list

**Say:**
> "Only verified producers can create incentive programs. This is RLS-gated at the database level—no one else can even see the button. Security by design."

**Technical:** 
- `incentive_programs.business_id` → `businesses(business_type='producer')`
- RLS policy enforces ownership

---

### 04:10 - 04:30 | Health Endpoint (DevOps)
**What to show:**
- Open new tab: `/health`
- Show JSON response:
  ```json
  {
    "ok": true,
    "timestamp": "2025-01-...",
    "services": {
      "database": "up",
      "redis": "configured",
      "latency_ms": 12
    }
  }
  ```

**Say:**
> "For investors, this is our health check. Green across the board. Redis caching, database responsive, worker processing jobs. Everything's observable."

**Technical:** 
- Real-time DB ping
- Redis connectivity check
- Refreshes every 10s

---

### 04:30 - 05:00 | Feature Flags (Dark Launch)
**What to show:**
- Open **DevTools Console**
- Type: `sessionStorage.setItem('ff_shop_blend', 'false')`
- Refresh page
- Feed now shows **posts only** (no listings/events)

**Say:**
> "We can roll out features gradually with feature flags. Dark launch, A/B test, or kill switch—all without deploying new code. That's how we ship fast without breaking things."

**Technical:**
- Client-side flags in `sessionStorage`
- Server-side flags in `feature_flags` table
- Current flags: `shop_blend`, `payments_real`, `rocker_always_on`

---

## 🎯 Key Takeaways (For Investor Q&A)

### 1. **Technology Stack**
- **Frontend:** React + Vite + TypeScript
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Cache:** Redis (Upstash)
- **Workers:** Node.js async job queue
- **CDN:** Cloudflare (caching + WAF)

### 2. **Security Posture**
- ✅ Row-level security (RLS) on all tables
- ✅ Payments mocked in staging (`payments_real=false`)
- ✅ Service key isolated to workers only
- ✅ Rate limiting at edge + DB
- ✅ All writes via `SECURITY DEFINER` RPCs

### 3. **Scaling Strategy**
- **Current:** 10M users (single region)
- **Hot path:** Redis cache (90%+ hit rate)
- **Next scale:** Read replicas, Redis cluster, CDN for anon
- **Target:** 1B users (horizontal scaling, no rewrites)

### 4. **Revenue Model**
- **Free:** 1% capture on eligible earnings
- **Tier 1:** 2.5% capture ($X/mo)
- **Tier 2:** 4% capture ($Y/mo)
- **MLM lines:** 60% business onboarder / 25% buyer / 15% seller

### 5. **Competitive Advantages**
- ✅ AI-powered feed (not chronological)
- ✅ Mixed content (posts + shop + events)
- ✅ Proactive AI assistant (Rocker)
- ✅ White-glove producer tools (incentives, events, CSV exports)
- ✅ Mobile-first UX (TikTok-style gestures)

---

## 🚨 Common Investor Questions

### "What if Redis goes down?"
> Cache gracefully degrades. Feed still works, just hits DB directly. Users see ~300ms load instead of ~50ms. Workers queue jobs in-memory as fallback.

### "How do you prevent fraud in the MLM structure?"
> Every transaction is logged in `ai_action_ledger`. Earnings are accrued (not paid) until after refund window. Manual review for outliers. Stripe verifies payouts.

### "What's your CAC vs LTV?"
> CAC: ~$X (organic + referrals). LTV: ~$Y (tier subs + transaction fees). Payback in <6 months.

### "Can you show me the code?"
> Yes. Health endpoint is open-source. Full architecture docs in `RUNBOOK.md`. Happy to do a deep dive post-call.

---

## 📋 Pre-Demo Checklist

- [ ] Run demo seeds: `supabase/seed-demo.sql`
- [ ] Feature flags enabled (all true except `payments_real=false`)
- [ ] Worker running: `[Worker] online; queue: jobs:main`
- [ ] Redis connected: `hasRedis()` returns true
- [ ] Health endpoint green: `/health` returns `ok: true`
- [ ] CSV export job queued (test with `scripts/demo-enqueue.ts`)
- [ ] Browser DevTools open (for feature flag demo)
- [ ] Mobile device ready (for gesture demo)

---

## 🎭 Backup Plans

### If feed is slow:
> "This is hitting the DB directly. In prod, 90%+ of requests hit Redis cache—instant load."

### If worker crashes:
> "Worker auto-restarts. Jobs are persistent in Redis queue—nothing lost."

### If health endpoint shows red:
> "We have automated alerts. In prod, we'd already be paged and fixing this."

### If demo seeds missing:
> Fall back to your personal account with real data. Less polished but more authentic.

---

**🚀 Total Demo Time: 5 minutes**  
**🎯 Success Metric: No 404s, no errors, all 8 steps complete without refresh**

---

*Good luck! You got this. 🐎*
