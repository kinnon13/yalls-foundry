# Yalls Platform - Task Breakdown

> **Sprint Allocation**: 2-week sprints, 3-5 devs  
> **Story Points**: Fibonacci (1, 2, 3, 5, 8, 13)  
> **Last Updated**: 2025-01-XX

---

## Legend

- 🟢 **Critical Path** - Blocks other work
- 🟡 **High Priority** - Needed for phase completion
- 🔵 **Nice-to-Have** - Can defer
- 🚨 **Flagged** - Phase 8 only, keep OFF

---

## Phase 0 - Foundations (Pre-Money)

### ROCKER-001: Tool SDK + Action Registry 🟢
**Story Points**: 8  
**Owner**: Backend  
**Dependencies**: None

**Description**:  
Core Rocker agent infrastructure: tool registry, action ledger, idempotency.

**Acceptance Criteria**:
- [ ] `ai_action_ledger` table created with RLS
- [ ] `tools/registry.ts` exports all callable tools
- [ ] Every tool logs input/output to ledger
- [ ] Correlation ID groups related actions
- [ ] Undo mechanism for reversible actions
- [ ] Admin can view action history per user

**Tasks**:
1. Create migration for `ai_action_ledger`
2. Implement `rocker_log_action(agent, action, input, output, result)` RPC
3. Build tool registry with metadata (name, description, params schema)
4. Wire Rocker service to log all tool calls
5. Create admin UI: "Agent Activity" tile
6. Unit tests for idempotency (duplicate correlation_id)

**Files**:
- `supabase/migrations/XXX_ai_action_ledger.sql`
- `src/lib/ai/rocker/tools/registry.ts`
- `src/routes/admin/panels/RockerActivityPanel.tsx`

---

### ROCKER-002: Proactive Daily Jobs + Frequency Caps 🟢
**Story Points**: 5  
**Owner**: Backend  
**Dependencies**: ROCKER-001

**Description**:  
Cron jobs that trigger Rocker nudges; respect quiet hours, caps.

**Acceptance Criteria**:
- [ ] `ai_consent` table with quiet_hours, frequency_cap
- [ ] Cron job: weekly "who can earn this week" (Sunday 9am)
- [ ] Cron job: daily label reminders (T+X hours after order)
- [ ] `rocker_check_consent(user_id)` respects caps
- [ ] Users can set quiet hours + opt-out entirely

**Tasks**:
1. Create `ai_consent` table + RLS
2. Implement `rocker_check_consent(user_id, action_type)` RPC
3. Build edge function `rocker-proactive-sweep` (calls tools via SDK)
4. Configure cron: `0 9 * * 0` (weekly), `0 */6 * * *` (label checks)
5. Create user settings UI: quiet hours picker, opt-out toggle
6. Test: user at cap → no nudges sent

**Files**:
- `supabase/migrations/XXX_ai_consent.sql`
- `supabase/functions/rocker-proactive-sweep/index.ts`
- `src/components/ai/SettingsPanel.tsx`

---

### ROCKER-003: AI Activity Ledger UI + Export 🟡
**Story Points**: 3  
**Owner**: Frontend  
**Dependencies**: ROCKER-001

**Description**:  
Admin tile + user-facing "What Rocker Did" page.

**Acceptance Criteria**:
- [ ] Admin: see all actions across all users (filterable)
- [ ] User: see their own actions (grouped by correlation_id)
- [ ] Export to CSV (user data export compliance)
- [ ] Undo button for reversible actions

**Tasks**:
1. Create `AgentActivityTile` component
2. Wire `SELECT * FROM ai_action_ledger WHERE user_id = auth.uid()`
3. Add CSV export button
4. Implement undo flow (calls tool with `undo:true` flag)
5. Style timeline view (grouped by correlation_id)

**Files**:
- `src/routes/admin/panels/RockerActivityPanel.tsx`
- `src/components/ai/ActivityTimeline.tsx`

---

### ROCKER-004: DM Disclosure + Opt-Out Enforcement 🟢
**Story Points**: 5  
**Owner**: Backend + Frontend  
**Dependencies**: None

**Description**:  
Auto-insert affiliate disclosures in DMs; enforce opt-out.

**Acceptance Criteria**:
- [ ] `messages.meta` contains `{has_referral_link: bool, disclosure_appended: bool}`
- [ ] DM composer detects referral links → appends disclosure
- [ ] Opt-out link in every DM footer
- [ ] `rocker_check_consent` blocks DMs if user opted out
- [ ] Admin can see opt-out rate

**Tasks**:
1. Update `messages` table schema (add `meta` jsonb)
2. Implement disclosure template (FTC-compliant)
3. Wire DM composer to detect links + append disclosure
4. Create opt-out page `/settings/communication`
5. Update `rocker_check_consent` to check DM opt-out
6. Test: opted-out user receives no Rocker DMs

**Files**:
- `supabase/migrations/XXX_messages_meta.sql`
- `src/components/rocker/Composer.tsx`
- `src/pages/settings/Communication.tsx`

---

## Phase 1 - Entity Graph & Claims

### CLAIM-001: Importers + Provenance 🟢
**Story Points**: 8  
**Owner**: Backend  
**Dependencies**: None

**Description**:  
Bulk import entities from external sources; track provenance.

**Acceptance Criteria**:
- [ ] `entities` table with `status: unclaimed`, `metadata.provenance`
- [ ] Importer script for CSV (name, kind, source)
- [ ] Dedupe logic: hash(name, kind) → existing or new
- [ ] `first_seen_at` tracks original creation timestamp
- [ ] Admin UI: view unclaimed entities, edit provenance

**Tasks**:
1. Create `entities` table + RLS
2. Build CSV importer script (`scripts/import-entities.ts`)
3. Implement dedupe function `entity_find_or_create(name, kind, provenance)`
4. Create admin panel: "Unclaimed Entities" table
5. Seed 100 sample entities (people, businesses, horses)
6. Unit test: duplicate import returns existing ID

**Files**:
- `supabase/migrations/XXX_entities.sql`
- `scripts/import-entities.ts`
- `src/routes/admin/panels/UnclaimedEntitiesPanel.tsx`

---

### CLAIM-002: Claim Wizard + Doc Check 🟢
**Story Points**: 13  
**Owner**: Full-stack  
**Dependencies**: CLAIM-001

**Description**:  
User-facing claim flow with email/SMS verify, doc upload for businesses.

**Acceptance Criteria**:
- [ ] `entity_claims` table with status workflow
- [ ] Wizard: step 1 (search entity), step 2 (verify email/SMS), step 3 (upload docs if business)
- [ ] Auto-approve personal claims with verified email match
- [ ] Business claims queue to admin for manual review
- [ ] Claimant receives email on approval/rejection
- [ ] First valid claim sets `entities.owner_user_id`

**Tasks**:
1. Create `entity_claims` table + RLS
2. Build search UI: autocomplete entities by name
3. Implement email/SMS OTP verification
4. Create file upload for business docs (Storage bucket `entity-claims`)
5. Wire approval queue in admin panel
6. Implement auto-approve logic for personal claims
7. Send email notifications via `supabase/functions/send-claim-notification`
8. Update entity ownership on approval

**Files**:
- `supabase/migrations/XXX_entity_claims.sql`
- `src/components/entities/ClaimWizard.tsx`
- `src/routes/admin/panels/ClaimQueuePanel.tsx`
- `supabase/functions/send-claim-notification/index.ts`

---

### CLAIM-003: Contributor Window Engine (30/60/90) 🟡
**Story Points**: 8  
**Owner**: Backend  
**Dependencies**: CLAIM-002

**Description**:  
Track contributor windows; award bounties if claimed within window.

**Acceptance Criteria**:
- [ ] `contributors` table with `trust_score`
- [ ] `entity_claims.contributor_user_id` + `window` enum
- [ ] Cron job: check expiring windows daily
- [ ] If claimed within window → log bounty (no payout yet, Phase 4)
- [ ] Admin UI: see contributor credits

**Tasks**:
1. Create `contributors` table + RLS
2. Update `entity_claims` schema (add `contributor_user_id`, `window`)
3. Implement `contributor_window_check(entity_id)` RPC
4. Create cron job `supabase/functions/check-contributor-windows`
5. Log bounty to `commissions` (status='pending', reason='contributor_bounty')
6. Build admin panel: "Contributor Leaderboard"

**Files**:
- `supabase/migrations/XXX_contributors.sql`
- `supabase/functions/check-contributor-windows/index.ts`
- `src/routes/admin/panels/ContributorLeaderboardPanel.tsx`

---

### CLAIM-004: Conflict Resolver UI + Queue 🟡
**Story Points**: 5  
**Owner**: Frontend  
**Dependencies**: CLAIM-002

**Description**:  
Admin tool to resolve duplicate claims.

**Acceptance Criteria**:
- [ ] Admin panel lists conflicting claims (same entity, multiple claimants)
- [ ] Side-by-side evidence view
- [ ] Approve one, reject others with reason
- [ ] Audit log records decision

**Tasks**:
1. Query conflicting claims (`GROUP BY entity_id HAVING count(*) > 1`)
2. Build conflict resolver UI (split pane)
3. Wire approve/reject actions to `entity_claim_approve/reject` RPCs
4. Log to `audit_log`
5. Test: resolve conflict → only one owner set

**Files**:
- `src/routes/admin/panels/ClaimConflictResolver.tsx`

---

## Phase 2 - Social + CRM Lite

### SOC-001: Posts/Feed with Listing/Event Cards 🟢
**Story Points**: 13  
**Owner**: Full-stack  
**Dependencies**: CLAIM-001 (entities)

**Description**:  
User-generated posts; feed with social + commerce cards.

**Acceptance Criteria**:
- [ ] `posts` table with `entity_id` (attached listing/event)
- [ ] Post composer: text + media upload + entity selector
- [ ] Feed query: mix posts + listings + events
- [ ] Listing card shows price, "Buy Now" → cart
- [ ] Event card shows date, "RSVP" → event detail
- [ ] Infinite scroll + real-time updates

**Tasks**:
1. Create `posts`, `post_reactions` tables + RLS
2. Build post composer UI (textarea, media dropzone, entity autocomplete)
3. Implement feed query: `SELECT * FROM posts JOIN entities ORDER BY created_at DESC`
4. Create `PostCard`, `ListingCard`, `EventCard` components
5. Wire "Buy Now" → `cart_upsert_item`
6. Add infinite scroll (Intersection Observer)
7. Enable realtime subscription on `posts` table

**Files**:
- `supabase/migrations/XXX_posts.sql`
- `src/components/posts/PostFeed.tsx`
- `src/components/posts/PostCard.tsx`
- `src/components/marketplace/ListingCard.tsx`

---

### SOC-002: Media Uploads with Quotas 🟡
**Story Points**: 5  
**Owner**: Backend  
**Dependencies**: None

**Description**:  
Secure media uploads; enforce size/count limits.

**Acceptance Criteria**:
- [ ] Storage bucket `user-media` (public read, authenticated write)
- [ ] RLS policy: max 10 files per user per day (free tier)
- [ ] Max file size: 10MB
- [ ] Allowed types: image/jpeg, image/png, video/mp4
- [ ] Quota exceeded → toast error

**Tasks**:
1. Create `user-media` bucket with RLS
2. Implement quota check in `upload-media` edge function
3. Wire frontend upload component (react-dropzone)
4. Add quota UI: "X/10 uploads today"
5. Test: 11th upload blocked

**Files**:
- `supabase/migrations/XXX_user_media_bucket.sql`
- `supabase/functions/upload-media/index.ts`
- `src/components/media/MediaUploadDialog.tsx`

---

### CRM-001: Contacts + Timelines + Tasks 🟢
**Story Points**: 13  
**Owner**: Full-stack  
**Dependencies**: None

**Description**:  
Basic CRM for businesses/creators to track contacts.

**Acceptance Criteria**:
- [ ] `crm_contacts`, `crm_events`, `tasks` tables
- [ ] Contact CRUD (name, email, phone, tags)
- [ ] Timeline: auto-logged events (viewed, listed, cart, order)
- [ ] Manual tasks: "Follow up with X"
- [ ] Rocker: "Suggest follow-ups for contacts with no recent activity"

**Tasks**:
1. Create `crm_contacts`, `crm_events`, `tasks` tables + RLS
2. Build contact list UI (table with filters)
3. Implement contact detail page (timeline + tasks)
4. Auto-log events via triggers (on order insert → crm_events)
5. Build task creator UI
6. Wire Rocker tool: `rocker_suggest_followups(owner_user_id)`

**Files**:
- `supabase/migrations/XXX_crm.sql`
- `src/routes/crm/contacts.tsx`
- `src/routes/crm/[id].tsx`
- `src/lib/ai/rocker/tools/crm.ts`

---

### CRM-002: Rocker Flows (Follow-up, Nudge List) 🟡
**Story Points**: 5  
**Owner**: Backend  
**Dependencies**: CRM-001

**Description**:  
Rocker-generated follow-up tasks.

**Acceptance Criteria**:
- [ ] Rocker detects cold contacts (no activity 30+ days)
- [ ] Proposes task: "Follow up with [name]"
- [ ] User approves → task created
- [ ] Rocker drafts DM template (with disclosure)

**Tasks**:
1. Implement `rocker_detect_cold_contacts(owner_user_id)` query
2. Build task proposal UI (approve/reject)
3. Wire DM draft generation
4. Test: Rocker proposes follow-up, user approves, task + DM created

**Files**:
- `src/lib/ai/rocker/flows/crm-followup.ts`
- `src/components/rocker/TaskProposalCard.tsx`

---

## Phase 3 - Marketplace & Events (Mock Checkout)

### MKT-001: Listings CRUD + AI Helpers 🟢
**Story Points**: 13  
**Owner**: Full-stack  
**Dependencies**: CLAIM-001 (entities)

**Description**:  
Create/edit/delete listings; Rocker generates title/description.

**Acceptance Criteria**:
- [ ] `listings` table with attributes, stock, price
- [ ] Listing creator: form with media upload
- [ ] AI helper: "Generate title" (Rocker tool)
- [ ] Stock tracking: decrement on mock purchase
- [ ] Status workflow: draft → active → sold
- [ ] Seller dashboard: my listings

**Tasks**:
1. Create `listings` table + RLS
2. Build listing form UI (title, description, price, stock, media)
3. Implement Rocker tool: `rocker_generate_listing_title(description)`
4. Wire stock decrement: `decrement_listing_stock(listing_id, qty)`
5. Create seller dashboard: table of listings with edit/delete
6. Test: stock goes to 0 → status='sold'

**Files**:
- `supabase/migrations/XXX_listings.sql`
- `src/routes/marketplace/create.tsx`
- `src/routes/marketplace/[id]/edit.tsx`
- `src/routes/dashboard/listings.tsx`

---

### EVT-001: Events CRUD + Tickets + Calendar 🟢
**Story Points**: 13  
**Owner**: Full-stack  
**Dependencies**: CLAIM-001 (entities)

**Description**:  
Create/edit/delete events; calendar export.

**Acceptance Criteria**:
- [ ] `events` table with ticket_classes, capacity
- [ ] Event creator: form with date/time picker, location, tickets
- [ ] RSVP flow: select ticket class → mock checkout
- [ ] Calendar export (iCal download)
- [ ] Event detail page with countdown timer

**Tasks**:
1. Create `events` table + RLS
2. Build event form UI (date/time, location, ticket classes)
3. Implement RSVP flow: `event_rsvp(event_id, ticket_class_id)`
4. Generate iCal file edge function
5. Create event detail page with countdown
6. Test: RSVP → order created (mock paid)

**Files**:
- `supabase/migrations/XXX_events.sql`
- `src/routes/events/create.tsx`
- `src/routes/events/[id].tsx`
- `supabase/functions/generate-ical/index.ts`

---

### ORD-001: Cart + Order States (Mock Paid) 🟢
**Story Points**: 8  
**Owner**: Backend  
**Dependencies**: MKT-001 (listings)

**Description**:  
Cart → checkout → mock payment → order.

**Acceptance Criteria**:
- [x] `carts`, `cart_items` exist (confirmed)
- [x] `orders`, `order_line_items` exist (confirmed)
- [ ] Mock checkout flow: click "Checkout" → order created with `mock_paid_at`
- [ ] Stock decrements on mock payment
- [ ] Order detail page shows status
- [ ] Email confirmation (mock sent)

**Tasks**:
1. Update `orders` schema (add `mock_paid_at`)
2. Implement `order_create_from_cart(cart_id, idempotency_key)` RPC (mock payment)
3. Build checkout page: summary → "Pay Now (Mock)" button
4. Wire stock decrement on order create
5. Create order detail page
6. Send email via `supabase/functions/send-order-confirmation`

**Files**:
- `supabase/migrations/XXX_orders_mock_paid.sql`
- `src/routes/checkout/index.tsx`
- `src/routes/orders/[id].tsx`
- `supabase/functions/send-order-confirmation/index.ts`

---

### ORD-002: Label Gate via Preview 🟡
**Story Points**: 5  
**Owner**: Frontend  
**Dependencies**: ORD-001

**Description**:  
Order detail shows "Print Label" button; opens preview modal.

**Acceptance Criteria**:
- [ ] Order detail: "Print Label" button (if status='paid')
- [ ] Opens `/preview/pay/labels` in modal (postMessage return)
- [ ] On return: `order.label_printed_at` set → unlocks commissions
- [ ] Admin sees label print rate per seller

**Tasks**:
1. Add "Print Label" button to order detail page
2. Open preview modal with `openPreviewWindow('/preview/pay/labels')`
3. Listen for `LABEL_PRINTED` postMessage → update order
4. Implement `order_mark_label_printed(order_id)` RPC
5. Create admin analytics tile: label print rate
6. Test: label printed → commission status changes to 'accrued'

**Files**:
- `src/routes/orders/[id].tsx`
- `src/lib/preview/openPreview.ts`
- `src/routes/admin/panels/LabelAnalyticsPanel.tsx`

---

## Phase 4 - Referrals, Memberships, Credits (Logic Only)

### REF-001: Referral Links + Resolver + Clicks 🟢
**Story Points**: 13  
**Owner**: Full-stack  
**Dependencies**: None

**Description**:  
Generate trackable share links; log clicks.

**Acceptance Criteria**:
- [ ] `referral_programs`, `referral_links`, `referral_clicks` tables
- [ ] User clicks "Share & Earn" → modal with link + QR code + poster
- [ ] Link format: `yalls.ai/r/{code}?t=list:{id}`
- [ ] Anonymous click tracking (no PII)
- [ ] Last-click attribution (30-day cookie)
- [ ] Admin: link performance dashboard

**Tasks**:
1. Create referral tables + RLS
2. Seed default `referral_programs` (30-day window, last-click-wins)
3. Implement `referral_create_link(target_type, target_id)` RPC
4. Build "Share & Earn" modal (copy link, QR, social share buttons)
5. Create public edge function `referral-track-click` (logs to `referral_clicks`)
6. Wire redirect: `/r/{code}` → resolve target → set cookie → redirect
7. Build admin dashboard: clicks per link, conversion funnel

**Files**:
- `supabase/migrations/XXX_referrals.sql`
- `src/components/referrals/ShareEarnModal.tsx`
- `supabase/functions/referral-track-click/index.ts`
- `src/routes/admin/panels/ReferralDashboard.tsx`

---

### REF-002: Last-Click Attach + Downline Edge 🟢
**Story Points**: 8  
**Owner**: Backend  
**Dependencies**: REF-001

**Description**:  
Bind anonymous click → user on signup/first order.

**Acceptance Criteria**:
- [ ] `downline_edges` table
- [ ] On signup: check cookie → attach referrer
- [ ] On first order: if no downline edge, check cookie → attach
- [ ] Only one referrer per user (first wins)
- [ ] Rocker notifies referrer: "X signed up via your link"

**Tasks**:
1. Create `downline_edges` table + RLS
2. Implement `attach_downline_on_signup(anon_session_id, new_user_id)` trigger
3. Implement `order_affiliate_bind(order_id, anon_session_id)` RPC
4. Wire cookie check on signup/order
5. Send Rocker DM: "Your referral signed up!"
6. Test: anonymous click → signup → downline edge created

**Files**:
- `supabase/migrations/XXX_downline_edges.sql`
- `src/lib/referrals/attach.ts`
- `src/lib/ai/rocker/notifications.ts`

---

### EARN-001: Earn Dashboard (+ Missed Earnings) 🟢
**Story Points**: 13  
**Owner**: Full-stack  
**Dependencies**: REF-002, MEM-001

**Description**:  
User-facing earnings page with pending/accrued/paid/missed breakdown.

**Acceptance Criteria**:
- [ ] `commissions` table with status workflow
- [ ] Dashboard shows:
  - Pending (label not printed)
  - Accrued (label printed, refund window passed)
  - Paid (transferred, Phase 8)
  - Missed (forfeited due to low membership)
- [ ] "Upgrade to capture" CTA if missed > $X
- [ ] Link performance: clicks, conversions, GMV
- [ ] Rocker nudge: "You missed $50 this month — upgrade to Tier 2?"

**Tasks**:
1. Create `commissions` table + RLS
2. Build Earn dashboard UI (tabs: Overview, Pending, Accrued, Paid, Missed)
3. Implement queries per tab
4. Add "Missed Earnings" section with upgrade CTA
5. Wire Rocker nudge: `rocker_nudge_missed_earnings(user_id, amount_cents)`
6. Test: user at Free tier → sees missed earnings

**Files**:
- `supabase/migrations/XXX_commissions.sql`
- `src/routes/earn/index.tsx`
- `src/lib/ai/rocker/nudges/missed-earnings.ts`

---

### MEM-001: Tier Gating (1/2.5/4%), No Billing 🟡
**Story Points**: 8  
**Owner**: Backend  
**Dependencies**: None

**Description**:  
Membership tier logic; no Stripe billing yet.

**Acceptance Criteria**:
- [ ] `memberships` table with tier enum
- [ ] Free=1%, Tier1=2.5%, Tier2=4% capture logic
- [ ] Forfeits logged separately (no payout)
- [ ] User can "upgrade" (mock, no charge) → tier changes
- [ ] Commission computation respects tier

**Tasks**:
1. Create `memberships` table + RLS
2. Seed default: all users start Free
3. Implement `membership_evaluate_capture(user_id, order_id)` RPC
4. Update `commission_compute_for_order` to check tier
5. Build tier selector UI (Free/Tier1/Tier2 cards)
6. Wire mock upgrade flow (no Stripe)
7. Test: upgrade to Tier2 → next order captures 4%

**Files**:
- `supabase/migrations/XXX_memberships.sql`
- `src/routes/settings/membership.tsx`
- `src/lib/commissions/compute.ts`

---

### CRD-001: Credits Ledger + Apply (Mock) 🟡
**Story Points**: 8  
**Owner**: Backend  
**Dependencies**: None

**Description**:  
YallCoins balance tracking; apply at checkout (mock, no real top-up yet).

**Acceptance Criteria**:
- [ ] `credits_ledger` table with running balance
- [ ] Promo credits: admin can grant via Rocker
- [ ] Apply at checkout: reduces total (mock only)
- [ ] Ledger audit trail (immutable)
- [ ] User sees balance on dashboard

**Tasks**:
1. Create `credits_ledger` table + RLS
2. Implement `credits_grant(user_id, delta_cents, reason)` RPC
3. Implement `credits_apply(user_id, order_id, amount_cents)` RPC (mock redemption)
4. Wire checkout page: "Apply Credits" checkbox
5. Build credits balance UI (dashboard widget)
6. Test: grant 500 cents → apply 200 → balance=300

**Files**:
- `supabase/migrations/XXX_credits_ledger.sql`
- `src/routes/checkout/index.tsx`
- `src/components/credits/BalanceWidget.tsx`

---

## Phase 5 - Persuasion/Nudges & Rocker Sales

### NDG-001: Nudge SDK (Components + Events) 🟢
**Story Points**: 13  
**Owner**: Frontend  
**Dependencies**: None

**Description**:  
Reusable nudge components with event tracking.

**Acceptance Criteria**:
- [ ] `nudges`, `nudge_variants`, `nudge_deliveries`, `nudge_results` tables
- [ ] Components: `NudgeSnackbar`, `NudgeStickyFooter`, `NudgeInlineCard`
- [ ] Auto-log delivery on render
- [ ] Track click/dismiss/timeout/purchase
- [ ] Respect caps (max per user per day)
- [ ] Rocker hook: `useNudge(trigger, context)`

**Tasks**:
1. Create nudge tables + RLS
2. Build `NudgeSnackbar` component (toast-like, dismissible)
3. Build `NudgeStickyFooter` component (bottom banner)
4. Build `NudgeInlineCard` component (feed insertion)
5. Implement event tracking: `nudge_record_delivery/result` RPCs
6. Create `useNudge` hook (fetches eligible nudge, logs impression)
7. Test: nudge shown → logged; click → result='click'

**Files**:
- `supabase/migrations/XXX_nudges.sql`
- `src/components/nudges/NudgeSnackbar.tsx`
- `src/components/nudges/NudgeStickyFooter.tsx`
- `src/components/nudges/NudgeInlineCard.tsx`
- `src/hooks/useNudge.ts`

---

### NDG-002: Nudge Studio (Admin) 🟢
**Story Points**: 13  
**Owner**: Full-stack  
**Dependencies**: NDG-001

**Description**:  
Admin UI to create/edit/A-B test nudges.

**Acceptance Criteria**:
- [ ] Create nudge: trigger, eligibility, template, caps
- [ ] A/B test: add variants (control, v1, v2)
- [ ] Launch: set active, monitor delivery/results
- [ ] Auto-pause losers (confidence interval)
- [ ] Scale winners (increase traffic %)

**Tasks**:
1. Build nudge creator form (trigger dropdown, eligibility JSON editor, template WYSIWYG)
2. Build variant manager (add/edit/delete variants)
3. Implement A/B logic: `nudge_select_variant(nudge_id, user_id)` RPC
4. Create analytics tiles: impressions, CTR, conv, revenue lift
5. Implement auto-pause: if variant underperforms control by >10% with p<0.05 → pause
6. Test: create nudge with 2 variants → launch → see results

**Files**:
- `src/routes/admin/nudges/create.tsx`
- `src/routes/admin/nudges/[id]/edit.tsx`
- `src/routes/admin/nudges/[id]/analytics.tsx`
- `src/lib/nudges/ab-test.ts`

---

### NDG-003: 5 Nudge Plays (A/B) 🟡
**Story Points**: 13  
**Owner**: Full-stack  
**Dependencies**: NDG-002

**Description**:  
Launch 5 live nudges with A/B variants.

**Acceptance Criteria**:
- [ ] Play 1: Prefilled cart ("Add X to your cart?")
- [ ] Play 2: Abandon rescue ("Forgot something? Cart expires in 1hr")
- [ ] Play 3: Social proof ("50 people viewed this today")
- [ ] Play 4: Bundle suggestion ("Customers also bought X + Y")
- [ ] Play 5: Event reminder ("X event starts in 2 hours!")
- [ ] Each has control + 2 variants
- [ ] Measure lift: ≥5% improvement or auto-pause

**Tasks**:
1. Configure Play 1: trigger='cart_idle', template={title,body,cta,listing_id}
2. Configure Play 2: trigger='cart_expire_soon', variants with urgency copy
3. Configure Play 3: trigger='listing_view', template with view count
4. Configure Play 4: trigger='cart_view', template with bundle listings
5. Configure Play 5: trigger='event_reminder_2hr', template with event details
6. Launch all 5 with 50/50 control/variant split
7. Monitor for 1 week → scale winners

**Files**:
- `src/lib/nudges/plays/prefilled-cart.ts`
- `src/lib/nudges/plays/abandon-rescue.ts`
- `src/lib/nudges/plays/social-proof.ts`
- `src/lib/nudges/plays/bundle-suggestion.ts`
- `src/lib/nudges/plays/event-reminder.ts`

---

## Phase 6 - Admin / Trust & Safety

### ADM-001: Control-Room Tiles (Usage, Gaps, Risk) 🟢
**Story Points**: 13  
**Owner**: Frontend  
**Dependencies**: Phase 0 (capabilities), Phase 1 (claims)

**Description**:  
Unified admin dashboard with key metrics.

**Acceptance Criteria**:
- [ ] Tiles: Capability adoption, Feature gaps, Risk flags, Active users, Revenue (mock)
- [ ] Filters: date range, user segment, entity type
- [ ] Drill-down: click tile → detailed view
- [ ] Export: CSV per tile

**Tasks**:
1. Build dashboard layout (grid of tiles)
2. Create capability adoption tile (% users with each feature enabled)
3. Create feature gaps tile (top voted gaps)
4. Create risk flags tile (open flags by severity)
5. Create active users tile (DAU/WAU/MAU)
6. Create revenue tile (mock GMV, commissions)
7. Wire drill-down modals

**Files**:
- `src/routes/admin/control-room.tsx`
- `src/components/admin/DashboardTile.tsx`
- `src/components/admin/tiles/*`

---

### RSK-001: Risk Flags + Queues 🟡
**Story Points**: 8  
**Owner**: Full-stack  
**Dependencies**: None

**Description**:  
Flag suspicious activity; queue for review.

**Acceptance Criteria**:
- [ ] `risk_flags` table with severity, status
- [ ] Auto-flag: duplicate claims, spam posts, high-risk sellers (>3 disputes)
- [ ] Manual flag: admin can flag any user/entity/order
- [ ] Review queue: list open flags with actions (resolve, escalate, ban)
- [ ] Audit log: every risk action logged

**Tasks**:
1. Create `risk_flags` table + RLS
2. Implement auto-flag triggers (e.g., on duplicate claim insert)
3. Build risk queue UI (table with filters)
4. Wire actions: resolve → status='resolved', escalate → status='escalated', ban → user.status='banned'
5. Log all actions to `audit_log`
6. Test: create duplicate claim → auto-flagged → appears in queue

**Files**:
- `supabase/migrations/XXX_risk_flags.sql`
- `src/routes/admin/risk/queue.tsx`
- `supabase/functions/risk-auto-flag/index.ts`

---

### AUD-001: Unified Audit Viewer 🟡
**Story Points**: 5  
**Owner**: Frontend  
**Dependencies**: None

**Description**:  
Single timeline view of all mutations.

**Acceptance Criteria**:
- [ ] `audit_log` table (if not exists, reuse existing)
- [ ] Filter by: user, table, action, date range
- [ ] Timeline view with expand/collapse details
- [ ] Export to CSV
- [ ] Admin-only access

**Tasks**:
1. Confirm `audit_log` table exists (or create)
2. Build audit viewer UI (timeline with filters)
3. Implement query: `SELECT * FROM audit_log WHERE ... ORDER BY created_at DESC`
4. Add CSV export
5. Test: perform action → appears in audit log

**Files**:
- `src/routes/admin/audit/index.tsx`

---

### OBS-001: Core KPIs Dashboards 🟡
**Story Points**: 8  
**Owner**: Frontend  
**Dependencies**: All previous phases

**Description**:  
Public-facing + admin KPI dashboards.

**Acceptance Criteria**:
- [ ] Public dashboard: GMV, active sellers, active buyers, events hosted
- [ ] Admin dashboard: Commission payout %, dispute rate, label print rate, AI cost per user
- [ ] Real-time updates (realtime subscription)
- [ ] Date range picker
- [ ] Export to CSV

**Tasks**:
1. Build public KPI dashboard (4 tiles)
2. Build admin KPI dashboard (6 tiles)
3. Wire realtime subscriptions (refresh on new order/payout)
4. Add date range filter
5. Implement CSV export per dashboard

**Files**:
- `src/routes/analytics/public.tsx`
- `src/routes/admin/analytics/index.tsx`

---

## Phase 7 - Scale & Readiness

### SCL-001: Load Tests & Budgets 🟢
**Story Points**: 8  
**Owner**: DevOps + Backend  
**Dependencies**: All previous phases

**Description**:  
Performance benchmarks; cost controls.

**Acceptance Criteria**:
- [ ] Load test: 1000 concurrent users → feed, search, checkout
- [ ] P95 latency <500ms (all endpoints)
- [ ] Error rate <0.5%
- [ ] AI cost per user <$0.10/mo
- [ ] Auto-scale: add read replicas if CPU >70%

**Tasks**:
1. Write load test scripts (k6 or Artillery)
2. Run tests against staging
3. Analyze results → identify bottlenecks
4. Add indexes, caching, query optimization
5. Implement AI cost tracking (log tokens per request)
6. Set up alerts: if cost > $0.10/user → notify
7. Configure auto-scaling (Supabase compute add-ons)

**Files**:
- `tests/load/feed.k6.js`
- `tests/load/checkout.k6.js`
- `src/lib/observability/ai-cost-tracker.ts`

---

### BAK-001: 12-Hour Ledger Snapshots to Off-Site 🟢
**Story Points**: 5  
**Owner**: Backend  
**Dependencies**: Phase 4 (commissions ledger)

**Description**:  
Periodic encrypted backups of critical tables.

**Acceptance Criteria**:
- [ ] Cron job: every 12 hours, export `commissions`, `orders`, `payouts` to encrypted CSV
- [ ] Upload to separate S3 bucket (cross-region)
- [ ] Checksum verification
- [ ] Retention: 90 days
- [ ] Restore drill: validate end-to-end recovery

**Tasks**:
1. Create edge function `supabase/functions/ledger-snapshot`
2. Export tables to CSV with encryption (AES-256)
3. Upload to S3 bucket (separate AWS account)
4. Log snapshot metadata to `snapshot_log` table
5. Schedule cron: `0 */12 * * *`
6. Run restore drill: download snapshot → decrypt → import → verify

**Files**:
- `supabase/functions/ledger-snapshot/index.ts`
- `scripts/restore-snapshot.ts`
- `supabase/migrations/XXX_snapshot_log.sql`

---

## Phase 8 - Payments (Flip Last) 🚨 FLAGGED

### PAY-001: Connect Onboarding (Flagged) 🚨
**Story Points**: 13  
**Owner**: Full-stack  
**Dependencies**: None

**Description**:  
Real Stripe Connect Custom onboarding; KYB/KYC.

**Acceptance Criteria**:
- [ ] `payout_accounts` table with Stripe account ID
- [ ] Onboarding flow: redirect to Stripe → return with account ID
- [ ] KYC state tracking: pending, verified, rejected
- [ ] Payout blocked until verified
- [ ] Admin: view KYC states, manually trigger review

**Tasks**:
1. Create `payout_accounts` table + RLS
2. Implement `stripe_connect_onboard(user_id)` edge function
3. Build onboarding page on `pay.yalls.ai`
4. Wire Stripe redirect → return URL → store account ID
5. Poll KYC state via Stripe API
6. Block payouts if `kyc_state != 'verified'`
7. Test: complete onboarding → account verified

**Files**:
- `supabase/migrations/XXX_payout_accounts.sql`
- `supabase/functions/stripe-connect-onboard/index.ts`
- `src/routes/pay/onboarding.tsx`

---

### PAY-002: PaymentIntents + Webhooks (Flagged) 🚨
**Story Points**: 13  
**Owner**: Backend  
**Dependencies**: PAY-001

**Description**:  
Replace mock checkout with real Stripe PaymentIntents.

**Acceptance Criteria**:
- [ ] Checkout creates real PaymentIntent
- [ ] Webhook: `payment_intent.succeeded` → order.status='paid'
- [ ] Webhook: `charge.refunded` → order.status='refunded', commissions voided
- [ ] Idempotency via `idempotency_key`
- [ ] 3DS/SCA support

**Tasks**:
1. Update checkout flow: call `stripe_create_payment_intent` edge function
2. Implement webhook handler: `supabase/functions/stripe-webhook`
3. Verify webhook signature
4. Update order status on `payment_intent.succeeded`
5. Void commissions on `charge.refunded`
6. Test: real card → payment succeeds → order paid

**Files**:
- `supabase/functions/stripe-create-payment-intent/index.ts`
- `supabase/functions/stripe-webhook/index.ts` (confirm exists + update)
- `src/routes/checkout/index.tsx`

---

### PAY-003: Payout Scheduler + Tax Docs (Flagged) 🚨
**Story Points**: 13  
**Owner**: Backend  
**Dependencies**: PAY-001, PAY-002

**Description**:  
Weekly payout batch; tax form collection.

**Acceptance Criteria**:
- [ ] `payouts` table with Stripe transfer ID
- [ ] Cron job: weekly (Monday 9am), batch all accrued commissions
- [ ] Min payout threshold: $10
- [ ] Reserves: 10% of payout held for 7 days (config)
- [ ] Tax form gate: no payout until 1099 collected
- [ ] Email notification on payout sent/failed

**Tasks**:
1. Create `payouts` table + RLS
2. Implement `payout_run_batch()` edge function
3. Query all accrued commissions → group by payee
4. Check min threshold + reserves
5. Create Stripe transfer for each payee
6. Log to `payouts` table
7. Send email notification
8. Schedule cron: `0 9 * * 1`
9. Implement tax form collection UI
10. Block payout if no tax form

**Files**:
- `supabase/migrations/XXX_payouts.sql`
- `supabase/functions/payout-run-batch/index.ts`
- `src/routes/pay/tax-forms.tsx`

---

## Next Actions

1. ✅ Create `/docs/ROADMAP.md`, `/docs/ERD.md`, `/docs/TASK_BREAKDOWN.md`
2. ⏳ Generate Phase 0 migrations (`ai_action_ledger`, `ai_consent`)
3. ⏳ Implement ROCKER-001 (Tool SDK + Registry)
4. ⏳ Implement CLAIM-001 (Entities + Importers)
5. ⏳ Set up feature flags in `.env` and `supabase/config.toml`

**Sprint Planning**: Start Phase 0-1 sprint on Monday. Assign tickets to devs.

---

**Last Updated**: 2025-01-XX
