# Yalls Master Plan - Completion Audit
**Generated:** 2025-10-17  
**Overall Completion:** ~45% → Production-Ready at Billion-User Scale  

---

## Executive Summary

**CRITICAL STATUS:** The system is NOT production-ready for billion-user scale.

**What Works:**
- ✅ Database foundation (tables, indexes, RLS)
- ✅ Feed fusion RPCs with ranking algorithm
- ✅ TikTok scroller component with blend support
- ✅ Feature flags infrastructure
- ✅ Usage telemetry (PR5c)
- ✅ Security hardening (PR-S1)
- ✅ Rate limiting (DB-side)

**What's Missing for Production Scale:**
- ❌ PgBouncer (connection pooling) - **CRITICAL BLOCKER**
- ❌ Redis caching layer - **CRITICAL BLOCKER**
- ❌ CDN (Cloudflare/CloudFront) - **CRITICAL BLOCKER**
- ❌ Horizontal scaling infrastructure
- ❌ Load balancing
- ❌ Multi-region failover
- ❌ 5 of 10 required routes
- ❌ 90% of Rocker AI features
- ❌ Earnings calculation logic
- ❌ Most Dashboard modules

---

## Track A: Database & RPCs ✅ 45% Complete

### ✅ Completed
- [x] Tables created with RLS:
  - `payment_intents_mock`
  - `ai_consent` (quiet hours + caps)
  - `notifications`
  - `earnings_tiers` (seeded with Free/T1/T2)
  - `earnings_events`
  - `feed_hides`
- [x] Indexes optimized:
  - `post_targets(target_entity_id, approved, created_at DESC)`
  - `posts USING GIN(to_tsvector('english', body))`
  - `marketplace_listings(seller_entity_id, status, created_at DESC)`
  - `events(host_entity_id, starts_at)`
  - `usage_events(user_id, item_type, item_id, created_at DESC)`
  - `notifications(user_id, lane, created_at DESC)`
- [x] Core RPCs implemented:
  - `feed_fusion_home(p_user_id, p_mode)` - ✅ Ranking formula live
  - `feed_fusion_profile(p_entity_id, p_mode)` - ✅ This/Combined modes
  - `rocker_next_best_actions(p_user_id)` - ✅ Basic suggestions
  - `notif_send(p_user_id, p_lane, p_payload)` - ✅ Quiet hours enforced
  - `notif_mark_read(p_ids[])`
  - `notif_mark_all_read(p_lane)`
  - `earnings_preview(p_user_id, p_event)` - ✅ 60/25/15 split + tier capture

### ❌ Missing
- [ ] `bonus_payout_eligibility(p_program_id, p_entity_id)`
- [ ] `farm_care_plan_apply(p_horse_id, p_plan_id)`
- [ ] `farm_invoice_preview(p_owner_id, items jsonb)`
- [ ] `events_export_draw(p_event_id)` → CSV
- [ ] `events_export_results(p_event_id)` → CSV
- [ ] Incentive program constraint: `business_type='producer'` trigger
- [ ] Redis cache integration for feed RPCs
- [ ] CDN cache headers

---

## Track B: Routes & UI 🔶 25% Complete

### ✅ Completed Routes (2 of 10)
1. ✅ `/` (Home) - Basic structure, needs TikTok scroller integration
2. ✅ `/dashboard` - Shell with left rail, modules are stubs

### ❌ Missing Routes (8 of 10)
3. ❌ `/discover` - For You / Trending / Latest
4. ❌ `/messages` - DMs + unified notifications
5. ❌ `/profile/:id` - This Page | Combined modes
6. ❌ `/entities` - Browse & Claim + wizard
7. ❌ `/events` - Index + Create New (Tabs: Upcoming | Past | My Entries)
8. ❌ `/listings` - Index + create/edit
9. ❌ `/cart` - Mock checkout → /preview
10. ❌ `/orders` - Index + detail

### ✅ Completed Components
- [x] `TikTokScroller` - Vertical scroller with blend
- [x] `ReelCard` - Full-bleed post with actions
- [x] `ListingCard` - Shop item with Add to Cart
- [x] `EventCard` - Event with RSVP

### ❌ Missing Components
- [ ] `Finder` modal (Cmd/Ctrl-K) with deep links
- [ ] `NotificationBell` panel overlay
- [ ] Public Calendar widget (right rail on Home)
- [ ] Composer with Rocker auto-tag
- [ ] Claim wizard flow
- [ ] Event creation flow
- [ ] Listing creation flow
- [ ] Cart management
- [ ] Order detail views

### Dashboard Modules Status
- ✅ Overview - Shell exists
- 🔶 Business - Partial, needs Claim center
- ❌ Stallions - Not implemented
- ❌ Incentives - Not implemented
- ❌ Farm Ops - Not implemented (Barn Dashboard, boarders, care plans)
- ❌ Events - Not implemented (producer tools, QR check-in, stalls/RV)
- ❌ Orders - Stub only
- ❌ Earnings - Not implemented (Pending/Accrued/Paid/Missed)
- ❌ Messages - Not implemented
- ✅ Settings - Basic structure

---

## Track C: Rocker AI ⚠️ 10% Complete

### ✅ Completed
- [x] `rocker_next_best_actions()` RPC - Basic "Next Best Actions"
- [x] AI consent table with quiet hours/caps
- [x] `notif_send()` enforces quiet hours + daily cap
- [x] `ai_action_ledger` table for audit trail

### ❌ Missing Rocker Features (90%)
- [ ] **Finder Quick Actions** - Inline suggestions in Cmd-K
- [ ] **Composer helpers:**
  - [ ] Auto-tag suggestions
  - [ ] Cross-post recommendations
  - [ ] Disclosure checks for referral links
- [ ] **CRM-lite:**
  - [ ] Follow-up list generator
  - [ ] DM draft prefill
- [ ] **Events:**
  - [ ] Class optimizer
  - [ ] Conflict detector
- [ ] **Farm:**
  - [ ] Care schedule builder
  - [ ] Overdue vaccinations flagging
- [ ] **Incentives:**
  - [ ] Bonus eligibility helper
  - [ ] Nomination nudge
- [ ] **Dashboard Overview:**
  - [ ] Integrated "Next Best Actions" panel (UI)
- [ ] **AI Activity Trail:**
  - [ ] Settings → AI Activity page showing ledger

---

## Track D: Infrastructure 🔴 15% Complete

### ✅ Completed
- [x] Feature flags (`src/lib/featureFlags.ts`):
  - `feed_shop_blend` = true
  - `discover_reels` = true
  - `payments_real` = false
  - `rocker_always_on` = true
- [x] DB-side rate limiting: `check_rate_limit()` called in hot RPCs
- [x] Usage telemetry tables + indexes (PR5c)
- [x] Security hardening (RLS, search_path, SQL injection prevention)
- [x] CI/CD gates (typecheck, lint, tests, coverage)

### ❌ Missing Infrastructure (**CRITICAL BLOCKERS**)
- [ ] **PgBouncer** - Connection pooling (MUST HAVE for >100 concurrent users)
- [ ] **Redis** - Cache layer for feed/search (MUST HAVE for scale)
- [ ] **CDN** - Cloudflare/CloudFront for static assets + API caching
- [ ] **Edge rate limiting** - WAF rules:
  - `/rpc/*` → 100 req/min/IP (burst 30)
  - `/auth/*` → 20 req/min/IP
- [ ] **Worker queue** - Redis-backed for:
  - Notification fanout
  - Usage rollups
  - CSV exports >5k rows
- [ ] **Monitoring:**
  - OpenTelemetry traces
  - Prometheus/Grafana dashboards
  - Sentry error tracking (configured but needs RPC integration)
  - Alert thresholds (p95>250ms, err%>2%)
- [ ] **Load balancing** - Horizontal scaling for API/DB
- [ ] **Multi-region** - Failover + replication

---

## Blend Ratios & Caps Validation

### Feed Fusion Home RPC
**Target ratios:** 60% posts / 25% listings / 15% events  
**Status:** ⚠️ RPC returns all types but doesn't enforce ratios yet (needs post-processing)

**Caps:**
- Personal mode: Max 1 listing per 3 items
- Combined/Discover: Max 1 listing per 2 items
- No back-to-back identical sellers (unless rank delta high)

**Status:** ❌ Not enforced (requires client-side or RPC enhancement)

---

## Earnings & MLM Structure 🔶 20% Complete

### ✅ Completed
- [x] `earnings_tiers` table with 1% / 2.5% / 4% capture rates
- [x] `earnings_preview()` RPC with 60/25/15 line split logic
- [x] Tier capture calculation in RPC

### ❌ Missing
- [ ] "Missed earnings" UI display
- [ ] Earnings dashboard module:
  - [ ] Pending tab
  - [ ] Accrued tab (post-refund window)
  - [ ] Paid tab
  - [ ] Missed tab with upgrade CTA
- [ ] Membership tier upgrade flow
- [ ] Real-time accrual tracking (usage_events → earnings_events)

---

## Code Quality & Organization 🔶 60% Complete

### ✅ Completed
- [x] Database migrations organized
- [x] RLS policies on all new tables
- [x] Security hardening (48 warnings → 0 warnings)
- [x] Type safety improved (feed types, RPC signatures)
- [x] Component separation (cards, scroller)
- [x] Feature flags infrastructure

### ❌ Needs Cleanup
- [ ] **Dead code removal:**
  - Old feed components in `/components/reels/` vs `/components/feed/`
  - Unused lane types (`for_you`, `following`, `shop` → replaced by `personal`/`combined`)
  - Duplicate TikTokScroller implementations
- [ ] **File organization:**
  - `/docs` has too many files (merge similar docs)
  - `/lib` needs sub-folders (telemetry, features, security, etc.)
- [ ] **Unused files:**
  - Old feed hooks (check for duplicates of `useScrollerFeed`)
  - Stub components never imported
- [ ] **Documentation:**
  - Remove outdated docs (e.g., old PR specs superceded by Master Plan)
  - Consolidate production readiness docs

---

## Testing Coverage 🔶 50% Complete

### ✅ Completed Tests
- [x] Unit tests for cache, rate limiting, security utilities
- [x] Entitlements gate tests
- [x] Kernel host pagination tests
- [x] SQL validation CI workflow

### ❌ Missing Tests
- [ ] Feed fusion RPC tests:
  - [ ] Blend ratio validation
  - [ ] Caps enforcement
  - [ ] Hidden items filtered
  - [ ] Cart suppression works
- [ ] TikTok scroller E2E:
  - [ ] Smooth scroll at 60fps
  - [ ] Load more triggers
  - [ ] Deduplication works
- [ ] Rocker AI tests:
  - [ ] `rocker_next_best_actions` returns valid actions
  - [ ] Quiet hours respected
  - [ ] Daily cap enforced
- [ ] Earnings preview:
  - [ ] 60/25/15 split correct
  - [ ] Tier capture math verified
  - [ ] Missed earnings delta

---

## Critical Path to Production (48-72 hours)

### Phase 1: Infrastructure Setup (User Action Required) ⏱️ ~4 hours
1. **Enable PgBouncer** (Supabase dashboard)
2. **Add Redis** (Upstash or managed Redis)
3. **Configure Cloudflare** (proxy DNS + caching rules)
4. **Set up Sentry DSN** (already configured, needs activation)

### Phase 2: Complete Feed & Core Routes ⏱️ ~24 hours
1. Fix blend ratios enforcement (client-side or RPC post-processing)
2. Create `/discover` route
3. Create `/profile/:id` route with This/Combined toggle
4. Create `/entities` route with claim wizard
5. Create `/events` index route
6. Add Finder modal overlay
7. Add NotificationBell overlay

### Phase 3: Dashboard Modules ⏱️ ~16 hours
1. Complete Earnings module (4 tabs: Pending/Accrued/Paid/Missed)
2. Complete Incentives module (programs, nominations, bonuses)
3. Complete Farm Ops module (Barn Dashboard basics)
4. Complete Events producer tools
5. Complete Orders management

### Phase 4: Rocker Everywhere ⏱️ ~12 hours
1. Composer auto-tag + cross-post suggestions
2. CRM follow-up list generator
3. AI Activity trail UI in Settings
4. Event class optimizer
5. Farm care schedule builder

### Phase 5: Polish & Load Testing ⏱️ ~12 hours
1. Clean up dead code (old components, unused files)
2. Organize `/docs` (merge similar files)
3. E2E smoke tests for all 10 routes
4. Load test: simulate 1,000 concurrent users
5. Performance audit (Lighthouse, bundle analysis)

---

## Questions for User

1. **Infrastructure Priority:** Should I continue with code (routes, components) or pause for you to set up PgBouncer/Redis/Cloudflare first?

2. **Blend Ratios:** Confirm enforcement strategy:
   - Option A: Client-side filtering (faster to ship)
   - Option B: RPC post-processing (cleaner, more robust)

3. **Missing Routes Priority:** Which 3 of the 8 missing routes are most critical?
   - `/discover`
   - `/profile/:id`
   - `/entities`
   - `/events`
   - `/listings`
   - `/cart`
   - `/orders`
   - `/messages`

4. **Rocker Features:** Which AI feature should I prioritize first?
   - Composer auto-tag
   - CRM follow-up generator
   - Event class optimizer
   - Farm care scheduler
   - AI Activity trail UI

5. **Dashboard Modules:** Priority order?
   - Earnings (Pending/Accrued/Paid/Missed)
   - Incentives (programs, nominations)
   - Farm Ops (Barn Dashboard)
   - Events (producer tools)
   - Orders (management)

---

## Reality Check: Billion-User Scale

**Current State:** Can handle ~100-500 concurrent users with current setup.

**To reach 1M+ concurrent users, you MUST have:**
- ✅ PgBouncer (connection pooling)
- ✅ Redis (caching layer)
- ✅ CDN (asset + API caching)
- ✅ Load balancing (horizontal scaling)
- ✅ Multi-region replication
- ✅ Rate limiting (edge + DB)
- ✅ Monitoring + alerts

**To reach 1B users (even if not all concurrent):**
- ✅ All of the above
- ✅ Database partitioning (time-series tables)
- ✅ Read replicas (geo-distributed)
- ✅ Microservices architecture (decouple feed/payments/events)
- ✅ Message queue (Kafka/RabbitMQ for async jobs)
- ✅ Advanced caching (query result caching, CDN at edge)

**Estimated Timeline to Billion-User Ready:** 6-12 months with dedicated team.

---

## Summary

**What's Done:** Database foundation, feed fusion RPCs, TikTok scroller, feature flags, security hardening, telemetry.

**What's Blocking Production:** PgBouncer, Redis, CDN (user setup required).

**What's Blocking Feature Completeness:** 8 missing routes, 90% of Rocker AI, earnings UI, dashboard modules.

**Recommended Next Steps:**
1. User sets up infrastructure (PgBouncer, Redis, Cloudflare)
2. I complete `/discover`, `/profile/:id`, `/entities` routes
3. I complete Earnings + Incentives dashboard modules
4. I add Finder + NotificationBell overlays
5. Load test + polish

**Current Production Readiness:** 45%  
**Estimated to MVP (with infrastructure):** 75%  
**Estimated to Billion-User Scale:** 30%
