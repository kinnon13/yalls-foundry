# Yalls Platform - Developer Roadmap

> **Status**: Phase 0 in progress  
> **Stripe Integration**: Phase 8 (flagged, inactive until P0-P7 complete)  
> **Last Updated**: 2025-01-XX

---

## Executive Summary

Yalls = **Social + CRM + Marketplace + Events + Payouts**, orchestrated by **Rocker** (mandatory proactive AI). Data, money, and attribution are first-class; compliance and safety are built in.

**Rollout Strategy**: Build all logic, flows, and UI with mock money (Phases 0-7). Flip Stripe live only in Phase 8 after full acceptance.

---

## Architecture Overview

### Subdomains
- `app.yalls.ai` - Consumer/creator/seller app (feed, profiles, listings, events, cart, Rocker dock, Earn dashboard)
- `pay.yalls.ai` - Financial console (Connect onboarding, payouts, labels, disputes) 
- `admin.yalls.ai` - Internal ops (risk, Rocker console, attribution browser, capabilities)
- `data.yalls.ai` - Exports & BI (GDPR, reports, dashboards)

### Core Principles
1. **Rocker Mandatory** - AI agent detects opportunity → proposes action → executes with consent
2. **Stripe Last** - All money flows mocked until Phase 8
3. **Attribution First-Class** - Direct + downline edges tracked from day 1
4. **Compliance Native** - Consent, disclosures, quiet hours, opt-out built in
5. **Preview Hardened** - Admin-only, write-blocked, HMAC-secured

---

## Phase Checklist

### Phase 0 - Foundations (Pre-Money) ✅ In Progress
**Goal**: Rocker agent core + capability system + preview security

#### Tables
- [x] `features`, `feature_locations`, `account_capabilities` (exists)
- [x] `capability_gaps`, `feature_feedback`, `usage_events` (exists) 
- [x] `preview_audit_log` (exists)
- [ ] `ai_action_ledger` (agent actions, input/output, result)
- [ ] `ai_consent` (user preferences, quiet hours, channels)

#### Functions
- [ ] `rocker_tool_registry` - List all callable tools
- [ ] `rocker_log_action` - Immutable action log
- [ ] `rocker_check_consent` - Frequency caps, quiet hours

#### Frontend
- [ ] Rocker Dock (bottom-right fab → action drawer)
- [ ] Capability Browser UI (seeds, gaps, "Ask-to-Install")
- [ ] Agent Activity Tile (recent actions, undo, export)

#### Acceptance Tests
- [ ] Rocker creates profile/listing/event draft via tool
- [ ] Capability gap submission works
- [ ] Preview write-blocking active, audit logs capture attempts

---

### Phase 1 - Entity Graph & Claims
**Goal**: Entities (unclaimed → claimed → verified), contributor windows

#### Tables
- [ ] `entities` (id, kind, handle, status, owner_user_id, created_at)
- [ ] `entity_claims` (entity_id, claimant_user_id, method, evidence, status, first_seen_at, claimed_at, contributor_user_id, window)
- [ ] `contributors` (user_id, trust_score)

#### Functions
- [ ] `entity_create_unclaimed` - Importers can seed entities
- [ ] `entity_claim_start` - Initiate claim with email/SMS verify
- [ ] `entity_claim_approve` - Admin/auto approval
- [ ] `contributor_window_check` - 30/60/90 day logic

#### Frontend
- [ ] Unclaimed banner on entity pages
- [ ] Claim wizard (email/SMS verify, doc upload for businesses)
- [ ] Admin claim queue (review conflicts, approve/reject)
- [ ] Contributor credit display (simulated)

#### Acceptance Tests
- [ ] First valid claim auto-approves; later duplicates queue
- [ ] Contributor shows "credited" within their window
- [ ] Provenance clearly labeled on unclaimed entities

---

### Phase 2 - Social + CRM Lite
**Goal**: Posts, feed, DMs, contact management, Rocker follow-up flows

#### Tables
- [ ] `posts` (author_id, entity_id, body, media[], visibility)
- [ ] `post_reactions` (post_id, user_id, kind)
- [ ] `messages` (sender_id, recipient_id, body, meta)
- [ ] `crm_contacts` (owner_user_id, name, email, phone, tags)
- [ ] `crm_events` (contact_id, type, data, occurred_at)
- [ ] `tasks` (owner_user_id, subject, due_at, status)

#### Functions
- [ ] `post_create` - With optional listing/event attachment
- [ ] `dm_send` - With disclosure insertion
- [ ] `crm_contact_upsert` - Deduplication logic
- [ ] `rocker_generate_followup_list` - AI-suggested tasks

#### Frontend
- [ ] Feed (posts with listing/event cards)
- [ ] Post composer (media upload, entity tag)
- [ ] DM composer (Rocker drafts with disclosure)
- [ ] CRM timeline (contacts, events, tasks)
- [ ] "Share & Earn" sheet (referral link + poster)

#### Acceptance Tests
- [ ] Listing "Share & Earn" produces referral link + auto-poster
- [ ] DM includes affiliate disclosure if link present
- [ ] Timeline shows views, DMs, mock orders

---

### Phase 3 - Marketplace & Events (Mock Checkout)
**Goal**: Listings, events, cart, orders (no real money)

#### Tables
- [ ] `listings` (seller_entity_id, title, media[], price_cents, stock_qty, status)
- [ ] `events` (host_entity_id, title, when, where, ticket_classes, capacity)
- [ ] `carts` (user_id, session_id)
- [ ] `cart_items` (cart_id, listing_id, qty, unit_price_cents, variant)
- [ ] `orders` (buyer_user_id, seller_entity_id, total_cents, status, mock_paid_at, label_printed_at)
- [ ] `order_line_items` (order_id, listing_id, qty, unit_price_cents)

#### Functions
- [x] `cart_upsert_item` (exists)
- [x] `cart_get` (exists)
- [x] `cart_merge_guest_to_user` (exists)
- [ ] `order_create_from_cart` - Mock payment intent
- [ ] `order_mark_label_printed` - Unlocks commissions
- [ ] `listing_create_with_ai` - Rocker helper

#### Frontend
- [ ] Listings CRUD (+ AI title/description helper)
- [ ] Events CRUD (+ calendar export)
- [ ] Cart (guest + logged-in, merge logic)
- [ ] Checkout (opens `/preview/pay/checkout`, returns mock success)
- [ ] Order detail (status, label button via `/preview/pay/labels`)

#### Acceptance Tests
- [ ] Order transitions to "paid" (mock); label marks `label_printed_at`
- [ ] Stock decrements on mock payment
- [ ] Cart merge on login works

---

### Phase 4 - Referrals, Memberships, Credits (Logic Only)
**Goal**: Attribution, earning simulation, membership tiers (no billing)

#### Tables
- [ ] `referral_programs` (default_rate_pct, cookie_days, last_click_wins)
- [ ] `referral_links` (code, owner_user_id, program_id, target_type, target_id, utm)
- [ ] `referral_clicks` (link_id, anon_session_id, ip_hash, ua_hash, ts)
- [ ] `downline_edges` (referrer_user_id, referred_user_id, link_id, created_at)
- [ ] `order_affiliations` (order_id, referrer_user_id, link_id, source)
- [ ] `memberships` (user_id PK, tier, starts_at, ends_at, state)
- [ ] `commissions` (order_id, payee_user_id, amount_cents, status, reason)
- [ ] `credits_ledger` (user_id, type, delta_cents, balance_cents_after, order_id)

#### Functions
- [ ] `referral_create_link` - Generate unique code
- [ ] `referral_track_click` - Anonymous session tracking
- [ ] `attach_downline_on_signup` - Bind anon → user
- [ ] `order_affiliate_bind` - Last-click attribution
- [ ] `commission_compute_for_order` - Pool split logic (1/3 BO, 1/3 BR, 1/3 SR)
- [ ] `membership_evaluate_capture` - Tier → % captured
- [ ] `credits_apply` - Mock redemption at checkout

#### Frontend
- [ ] Referral link generator (share modal)
- [ ] Earn dashboard (pending/"would-have-earned"/missed earnings)
- [ ] Membership tier selector (free/tier1/tier2 → 1%/2.5%/4%)
- [ ] Credits balance + apply at checkout (mock)
- [ ] "Missed earnings" alert + upgrade CTA

#### Acceptance Tests
- [ ] Attribution works on mock orders
- [ ] Membership tier changes displayed earning %
- [ ] Credits apply reduces mock total; ledger records delta
- [ ] Missed earnings shown when tier < required

---

### Phase 5 - Persuasion/Nudges & Rocker Sales
**Goal**: Nudge SDK, Studio, 5 live plays, A/B framework

#### Tables
- [ ] `nudges` (trigger, eligibility, template, cta, caps, status)
- [ ] `nudge_variants` (nudge_id, variant_key, payload)
- [ ] `nudge_deliveries` (nudge_id, variant_id, user_id, channel, shown_at)
- [ ] `nudge_results` (delivery_id, action, at)

#### Functions
- [ ] `nudge_eligible` - Check caps, quiet hours, eligibility
- [ ] `nudge_record_delivery` - Log impression
- [ ] `nudge_record_result` - Track click/dismiss/purchase
- [ ] `nudge_ab_winner` - Auto-pause losers, scale winners

#### Frontend
- [ ] Nudge SDK components (snackbar, sticky footer, inline card)
- [ ] Nudge Studio (admin) - Create/edit/A-B/monitor
- [ ] 5 live plays:
  - [ ] Prefilled cart
  - [ ] Abandon rescue
  - [ ] Social proof
  - [ ] Bundle suggestion
  - [ ] Event reminder
- [ ] Nudge analytics tiles (CTR, conv, revenue lift, opt-out)

#### Acceptance Tests
- [ ] Each nudge shows ≥5% lift on its step or auto-pauses
- [ ] User can dismiss/opt-out; prefs respected
- [ ] A/B winner scales; loser retires

---

### Phase 6 - Admin / Trust & Safety
**Goal**: Control Room, risk queues, audit viewer, data export preview

#### Tables
- [ ] `audit_log` (who_user_id, action, target_table, target_id, meta, created_at)
- [ ] `risk_flags` (subject_type, subject_id, reason, severity, status)

#### Functions
- [ ] `audit_write` - Immutable log entry
- [ ] `risk_flag_create` - Auto + manual flagging
- [ ] `admin_export_contacts` - Opted-in followers only

#### Frontend
- [ ] Control Room dashboard (capabilities, usage, gaps, risk)
- [ ] Risk queue (duplicate claims, spam, high-risk sellers)
- [ ] Audit viewer (unified timeline, filterable)
- [ ] Data exports page (CSV/JSON, no PII exfiltration)

#### Acceptance Tests
- [ ] Admin sees contributor windows, resolves conflicts
- [ ] Risk flags surface, queue UI functional
- [ ] Audit log complete (every mutation tracked)

---

### Phase 7 - Scale & Readiness
**Goal**: Load tests, cost controls, backup/restore

#### Infrastructure
- [ ] Load tests (feed, search, claim spikes, Rocker calls)
- [ ] Model cost controls (small-model default, prompt caching)
- [ ] 12-hour ledger snapshots to off-site storage
- [ ] Backup restore drill

#### Acceptance Tests
- [ ] P95 latency within targets
- [ ] Error rate <0.5%
- [ ] Backup restore passes end-to-end
- [ ] AI costs under budget thresholds

---

### Phase 8 - Payments (Flip Last) 🚨 FLAGGED
**Goal**: Real Stripe Connect, payouts, tax docs, commission transfers

#### Tables
- [ ] `payout_accounts` (user_id, stripe_account_id, kyc_state, hold_balance_cents)
- [ ] `payouts` (account_id, amount_cents, status, scheduled_at, sent_at)
- [ ] `ledger_journal` (occurred_at, description, source, source_id)
- [ ] `ledger_entries` (journal_id, account_code, debit_cents, credit_cents)

#### Functions
- [ ] `stripe_connect_onboard` - KYB/KYC redirect
- [ ] `stripe_webhook_handler` - payment_intent.succeeded, charge.refunded
- [ ] `commission_accrue_after_window` - Cron sweeper post-refund window
- [ ] `payout_run_batch` - Weekly scheduled payouts (min threshold, reserves)

#### Frontend
- [ ] Connect onboarding flow (KYC redirect from `pay.yalls.ai`)
- [ ] Payout dashboard (balances, holds, schedules, history)
- [ ] Dispute center (evidence upload, resolution tracking)
- [ ] Real checkout replaces preview (SCA, 3DS, idempotency)
- [ ] Tax form gates (1099 collection before payout)

#### Acceptance Tests
- [ ] $1 end-to-end test path (Connect → purchase → commission → payout)
- [ ] Refund → clawback logic works
- [ ] Dispute flow operational
- [ ] Tax forms block payouts until collected

---

## Feature Flags

Add to `.env` and feature flag system:

```bash
# Preview System
VITE_PREVIEW_ENABLED=true
VITE_PREVIEW_ALLOWED_ORIGINS=https://app.yalls.ai,https://staging.yalls.ai

# Payments (keep OFF until Phase 8)
FEATURE_PAYMENTS=false
FEATURE_STRIPE_CONNECT=false
FEATURE_REAL_PAYOUTS=false

# Rocker
FEATURE_ROCKER_PROACTIVE=true
FEATURE_ROCKER_NUDGES=false  # Phase 5

# Credits
FEATURE_CREDITS_TOPUP=false  # Phase 8
FEATURE_CREDITS_GIFT=false   # Phase 8

# Memberships
FEATURE_MEMBERSHIP_BILLING=false  # Phase 8
```

---

## Branch Strategy

- `main` - Production (Phases 0-7 safe, Phase 8 flagged OFF)
- `phase/{0-8}-{name}` - Feature branches per phase
- `hotfix/*` - Emergency patches
- `preview/*` - Preview-only features (admin-gated)

---

## Daily Standups

**Status Updates**:
1. What shipped yesterday?
2. What's blocked?
3. Which phase needs help?
4. Are we on track for Phase 8 gate?

---

## Success Metrics (per Phase)

### Phase 0-2
- Rocker can draft 5 entity types
- Claims resolve in <24hr
- Feed CTR ≥2%

### Phase 3-4
- Mock checkout conversion ≥25%
- Attribution attach rate ≥80%
- Missed earnings visible

### Phase 5-6
- Nudges lift ≥5% on target metric
- Risk false-positive rate <5%
- Admin response time <4hr

### Phase 7
- P95 latency <500ms
- Error rate <0.5%
- AI cost per user <$0.10/mo

### Phase 8
- Real $ end-to-end in <2min
- Dispute win rate ≥60%
- Payout on-time ≥95%

---

## Next Steps

1. ✅ Create this roadmap
2. ⏳ Generate Phase 0 migrations (core Rocker tables)
3. ⏳ Wire Rocker Dock UI (minimal)
4. ⏳ Seed capability registry
5. ⏳ Document every tool Rocker can call

**Target**: Phase 0 complete by EOW; Phase 1-2 sprint starts Monday.

---

## Questions / Escalations

- **Compliance**: Do membership forfeits need tax treatment? (Legal review Phase 4)
- **Payments**: Stripe approval timeline for Custom Connect? (Phase 8 gate)
- **AI**: Cost per user hitting budget? (Monitor Phase 0-5)

---

**Last Updated**: Auto-generated via `scripts/update-roadmap.ts`
