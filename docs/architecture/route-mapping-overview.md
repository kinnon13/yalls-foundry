# Route Mapping Overview

**Last Updated**: 2025-01-18  
**Purpose**: Comprehensive overview of all routes, RPCs, tables, and their relationships across the platform

---

## Core Architecture Principles

### Entity Model
- **Entities** = User-owned profiles (business, stallion, mare, rider, farm, etc.)
- Each entity can be:
  - **Public** (browseable at `/entities/:id`)
  - **Managed** (via workspace at `/workspace/:entityId`)
  - **Multi-user** (via `entity_members` table)

### Workspace Model
- **Workspace** = Dashboard context (personal or entity-based)
- Routes: `/workspace/personal/*` or `/workspace/:entityId/*`
- Modular business tools enabled via feature flags
- Switching workspaces pivots UI and data context

### Route Categories
1. **Public** - Browseable without auth (`/events`, `/marketplace`, `/entities`)
2. **Private** - User-specific, auth required (`/entries`, `/cart`)
3. **Organizer** - Role-gated management (`/organizer`)
4. **Workspace** - Entity context tools (`/workspace`)

---

## Area Breakdown

## 1. Admin Area

### Audit Subarea
**Routes:**
- `/admin/audit`

**RPCs:**
- None (direct table access)

**Tables:**
- `admin_audit` - Admin action logs
- `admin_audit_log` - Audit trail
- `preview_audit_log` - Preview system audit

**Purpose:** Track all administrative actions for compliance and debugging

---

### Claims Moderation Subarea
**Routes:**
- `/admin/claims`

**RPCs:**
- `entity_claim_start(entity_id, method, contact_target)` - Initiate entity claim
- `entity_claim_approve(claim_id)` - Approve claim and transfer ownership
- `entity_claim_reject(claim_id, reason)` - Reject claim with reason

**Tables:**
- `entity_claims` - Claim requests and status
- `claim_events` - Claim activity timeline
- `claim_bounties` - Contributor rewards for claimed entities

**Purpose:** Moderate entity ownership claims and manage contributor bounties

---

### Control Room & Feature Flags Subarea
**Routes:**
- `/admin/control-room`
- `/admin/features`

**RPCs:**
- `feature_introspect()` - Get feature metadata
- `feature_probe(feature_id)` - Check feature status
- `admin_clear_entitlement_override(user_id, feature_id)`
- `admin_set_entitlement_override(user_id, feature_id, granted)`
- `update_feature_flags_updated_at()` - Trigger for flag updates

**Tables:**
- `features` - Feature definitions
- `feature_flags` - Runtime feature toggles
- `feature_catalog` - Feature metadata catalog
- `feature_locations` - Feature-to-code mapping
- `entitlement_overrides` - Manual feature access grants
- `entitlement_override_audit` - Override history
- `rpc_observations` - RPC usage telemetry
- `plan_entitlements` - Plan-based feature access

**Purpose:** Manage feature rollouts, A/B tests, and per-user/plan entitlements

---

## 2. AI Area

### Activity Subarea
**Routes:**
- `/ai/activity`

**RPCs:**
- `rocker_next_best_actions(user_id, context)` - Generate action suggestions
- `rocker_log_action(user_id, agent, action, input, output, result)` - Log AI actions
- `rocker_generate_followup_list(days_idle)` - Find contacts to follow up with
- `rocker_check_consent(user_id, action_type)` - Verify user consent for proactive AI

**Tables:**
- `rocker_campaigns` - AI campaign definitions
- `rocker_campaign_audience` - Campaign targeting
- `rocker_conversations` - AI conversation threads
- `rocker_notifications` - AI-generated notifications
- `ai_user_analytics` - User behavior analytics
- `ai_action_ledger` - Complete AI action audit trail

**Purpose:** Proactive AI assistant that suggests actions, manages campaigns, and respects user consent

---

### Memory & Knowledge Subarea
**Routes:**
- None (backend service)

**RPCs:**
- `ai_mem_get(route, target)` - Retrieve selector memory
- `ai_mem_mark(route, target, success)` - Update success/failure
- `ai_mem_upsert(route, target, selector, meta)` - Store selector memory
- `ai_mem_promote(route, target)` - Promote to global catalog
- `ai_propose(from, to, proposer, source, payload, reason)` - Propose knowledge promotion
- `ai_approve(proposal_id, admin, decision, notes)` - Approve/reject promotion

**Tables:**
- `ai_user_memory` - Personal AI learnings (preferences, patterns)
- `ai_selector_memory` - User-specific UI selector memory
- `ai_selector_catalog` - Global validated selectors
- `ai_global_knowledge` - Shared knowledge base
- `knowledge_items` - Structured knowledge entries
- `knowledge_chunks` - Embeddings for semantic search
- `ai_knower_access_log` - Privacy audit trail
- `ai_messages` - AI-to-user messages
- `ai_sessions` - AI conversation sessions
- `memory_links` - Relationships between memories
- `memory_share_requests` - Memory sharing permissions

**Purpose:** AI learns from user behavior, stores preferences, and builds knowledge base with privacy controls

---

### Policy & Privacy Subarea
**Routes:**
- None (config/settings)

**RPCs:**
- None (policies enforced at RLS level)

**Tables:**
- `ai_policy_config` - Tenant-level AI policies
- `ai_policy_rules` - Specific policy rules and matchers
- `ai_blocklist` - Blocked patterns/targets
- `ai_user_privacy` - User privacy preferences
- `ai_consent` - User consent settings (proactive, channels, quiet hours)
- `ai_user_consent` - Detailed consent tracking

**Purpose:** Enforce AI governance, respect user privacy, and manage consent

---

## 3. Discovery Area

### Search & Explore Subarea
**Routes:**
- `/search` - Global search
- `/marketplace/*` - Marketplace browsing (collapsed family)
- `/stallions/*` - Stallion directory (collapsed family)

**RPCs:**
- `get_price_suggestions(listing_id)` - AI pricing recommendations

**Tables:**
- `discovery_items` - Searchable content index
- `listing_taxonomy` - Product categorization
- `dynamic_categories` - Auto-generated categories
- `stallion_profiles` - Stallion-specific data

**Purpose:** Public discovery of listings, stallions, and content

---

### Public Profiles Subarea
**Routes:**
- `/profile` - Current user's public profile
- `/entities/*` - Public entity pages (collapsed family)

**RPCs:**
- None (read-only public data)

**Tables:**
- `entities` - Core entity records
- `entity_profiles` - Public profile data
- `profiles` - User profiles
- `profile_badges` - Achievement badges
- `media` - Media files
- `media_entities` - Media-to-entity links

**Purpose:** Public-facing profiles for users and entities

---

### Public Events Browse Subarea
**Routes:**
- `/events` - Events catalog with filters
- `/events/:slug` - Event detail page
- `/events/:slug/results` - Public results
- `/events/:slug/draw` - Public draw results

**RPCs:**
- `get_event_viewable(event_id)` - Fetch public event data

**Tables:**
- `events` - Event records (uses `slug` for public URLs)
- `event_classes` - Competition classes
- `draws` - Draw results
- `results` - Competition results
- `live_streams` - Livestream info

**Purpose:** Public event discovery and results viewing

---

### Feed (Public View) Subarea
**Routes:**
- `/feed` - Personalized content feed

**RPCs:**
- `feed_fusion_home(user_id, limit, offset)` - Home feed algorithm
- `feed_fusion_profile(entity_id, limit, offset)` - Profile feed
- `feed_fusion_home_rate_limited(user_id, limit)` - Rate-limited feed
- `feed_hide(entity_id, post_id, reason)` - Hide post
- `feed_unhide(entity_id, post_id)` - Unhide post
- `feed_pending_targets(entity_id)` - Get pending feed targets

**Tables:**
- `posts` - Content posts
- `post_drafts` - Unpublished drafts
- `post_reshares` - Repost tracking
- `post_saves` - Saved posts
- `post_tags` - Post tagging
- `post_targets` - Post distribution targets
- `feed_hides` - Hidden posts
- `horse_feed` - Horse-specific feed items
- `views_coldstart` - View tracking for recommendations

**Purpose:** Algorithmic content feed with personalization

---

## 4. Dashboard Area

### Home & Workspace Subarea
**Routes:**
- `/dashboard` - Redirects to last workspace
- `/workspace/personal/dashboard` - Personal workspace
- `/workspace/:entityId/dashboard` - Entity workspace

**RPCs:**
- `get_user_aggregate_counts(user_id)` - Get user stats
- `get_user_role(user_id)` - Get user role
- `get_user_workspaces()` - List accessible workspaces
- `get_workspace_summary(entity_id)` - Dashboard KPI tiles

**Tables:**
- `businesses` - Business entities
- `business_team` - Team membership
- `business_kpi_snapshots` - Historical KPI data
- `capability_gaps` - Feature adoption tracking
- `user_shortcuts` - Personal shortcuts
- `user_ui_prefs` - UI preferences

**Purpose:** Central hub for managing entities and accessing workspace tools

---

### Entities (Owned Profiles) Subarea
**Routes:**
- `/workspace/:entityId/entities` - Manage owned entities
- `/claim/:id` - Claim ownership flow

**RPCs:**
- `entity_create_unclaimed(kind, display_name, handle, provenance, contributor_id)` - Create entity
- `entity_claim_start(entity_id, method, contact_target)` - Start claim
- `entity_claim_approve(claim_id)` - Approve claim
- `entity_claim_reject(claim_id, reason)` - Reject claim
- `contributor_window_status(entity_id)` - Check bounty window

**Tables:**
- `entities` - All entities
- `entity_members` - Multi-user access
- `entity_profiles` - Profile data
- `entity_profiles_*` - Partitioned profile tables
- `entity_ui_prefs` - Entity-specific UI settings
- `entity_ingest_log` - Import history
- `favorite_entities` - User favorites
- `saved_items` - Saved marketplace items
- `contributors` - Contributor stats and bounties

**Purpose:** Manage owned entities (businesses, stallions, mares, riders, farms)

---

### CRM Subarea
**Routes:**
- `/workspace/:entityId/crm` - CRM dashboard

**RPCs:**
- `crm_contact_upsert(name, email, phone, tags)` - Create/update contact
- `update_crm_contacts_updated_at()` - Trigger for updates

**Tables:**
- `crm_contacts` - Contact records
- `crm_activities` - Activity tracking
- `crm_events` - Event timeline
- `crm_events_*` - Partitioned event tables

**Purpose:** Contact relationship management per workspace

---

### Listings (Seller) Subarea
**Routes:**
- `/workspace/:entityId/listings` - Manage listings
- `/listings/*` - Listing management (collapsed family)

**RPCs:**
- `get_price_suggestions(listing_id)` - AI pricing

**Tables:**
- `marketplace_listings` - Product listings
- `listing_taxonomy` - Categorization
- `media` - Product images
- `media_entities` - Image links
- `taxonomies` - Taxonomy structure
- `taxonomy_values` - Taxonomy data

**Purpose:** Seller tools for managing marketplace listings

---

### Orders (Seller Console) Subarea
**Routes:**
- `/workspace/:entityId/orders` - Order management
- `/orders/*` - Order details (collapsed family)

**RPCs:**
- `order_start_from_cart(cart_id, idempotency_key)` - Create order
- `decrement_listing_stock(listing_id, qty)` - Reduce inventory

**Tables:**
- `orders` - Order records
- `order_line_items` - Order items
- `settlement_batches` - Payment batches
- `payouts` - Seller payouts
- `commission_ledger` - Commission tracking
- `ledger_entries` - Financial ledger

**Purpose:** Seller revenue and order fulfillment

---

### Incentives Subarea
**Routes:**
- `/workspace/:entityId/incentives` - Incentive dashboard
- `/incentives/dashboard` - Legacy alias

**RPCs:**
- `attach_incentive_to_event(entity_id, incentive_id, event_id)` - Link incentive to event

**Tables:**
- `incentives` - Incentive programs
- `incentive_nominations` - Nominated entries
- `promotion_targets` - Promotion targeting
- `promotion_redemptions` - Redemption tracking
- `promotions` - Active promotions

**Purpose:** Manage incentive programs and attach to events

---

### Calendar Subarea
**Routes:**
- `/workspace/:entityId/calendar` - Workspace calendar

**RPCs:**
- `update_calendar_updated_at()` - Trigger for updates

**Tables:**
- `calendars` - Calendar instances
- `calendar_events` - Events
- `calendar_event_reminders` - Reminders
- `calendar_event_attendees` - Attendees
- `calendar_collections` - Grouped calendars
- `calendar_collection_members` - Collection members
- `calendar_collection_shares` - Collection sharing
- `calendar_shares` - Calendar sharing

**Purpose:** Shared calendar for workspace scheduling

---

### Farm Ops Subarea
**Routes:**
- `/workspace/:entityId/farm` - Farm management
- `/farm/*` - Farm tools (collapsed family)

**RPCs:**
- None (CRUD operations)

**Tables:**
- `farm_horses` - Horses at facility
- `boarders` - Boarder records
- `care_plans` - Care schedules
- `tasks` - Farm tasks
- `time_windows` - Scheduling windows

**Purpose:** Daily farm operations and horse care

---

### Messaging Subarea
**Routes:**
- `/workspace/:entityId/messages` - Workspace messages

**RPCs:**
- `dm_send(recipient, body, metadata)` - Send direct message

**Tables:**
- `messages` - Direct messages
- `conversation_sessions` - Message threads

**Purpose:** Direct messaging within workspace context

---

### Notifications (Header & Widgets) Subarea
**Routes:**
- None (surfaces in header and dashboard widgets)

**RPCs:**
- `notif_mark_all_read(user_id)` - Mark all as read
- `notif_mark_read(notification_id)` - Mark one as read
- `notif_send(user_id, type, payload)` - Send notification

**Tables:**
- `notifications` - Notification records
- `notification_receipts` - Read status
- `notification_prefs` - User preferences
- `outbox` - Pending deliveries

**Purpose:** Real-time notifications in UI (not a separate area)

---

## 5. Events Area

### Management Subarea
**Routes:**
- `/organizer/events` - Events you manage
- `/organizer/events/:id/manage` - Event dashboard
- `/organizer/events/:id/check-in` - QR check-in

**RPCs:**
- `draw_generate(event_id, class_id, algorithm)` - Generate draw

**Tables:**
- `events` - Event records
- `event_classes` - Competition classes
- `draws` - Draw results
- `results` - Competition results
- `result_flags` - Result annotations
- `payout_rules` - Payout configuration
- `live_streams` - Livestream data
- `tour_schedules` - Tour scheduling

**Purpose:** Organizer tools for event management

---

### Entrant Flows Subarea
**Routes:**
- `/entries` - My entries
- `/entries/draws` - My draws
- `/entries/results` - My results
- `/events/:slug/enter` - Entry submission flow

**RPCs:**
- `entry_submit(class_id, rider_user_id, horse_entity_id, opts)` - Submit entry
- `reservation_check_in(reservation_id)` - Check in
- `reservation_issue_qr(reservation_id)` - Generate QR code

**Tables:**
- `entries` - Entry records
- `entry_checkin_log` - Check-in tracking
- `stalls_rv_reservations` - Stall/RV bookings
- `stalls_rv_inventory` - Available stalls/RVs

**Purpose:** Participant entry submission and tracking

---

## 6. EquiStats Area (NEW)

### Horse Performance Subarea
**Routes:**
- `/equistats/horse/:id` - Horse performance page
- `/equistats/compare` - Compare horses

**RPCs:**
- `payout_compute(horse_entity_id, date_range)` - Calculate earnings

**Tables:**
- `results` - Competition results
- `payouts` - Earnings records
- `commission_ledger` - Commission tracking
- `ledger_entries` - Financial ledger
- `leaderboard_entries` - Leaderboard rankings

**Purpose:** Analytics for horse performance and earnings (EquiStat/QData equivalent)

---

### Earnings & Programs Subarea
**Routes:**
- `/equistats/earnings/:entityId` - Earnings dashboard

**RPCs:**
- None (aggregation queries)

**Tables:**
- `incentives` - Incentive programs
- `promotion_targets` - Program participation
- `promotion_redemptions` - Redemptions
- `price_tests` - A/B pricing tests
- `price_test_variants` - Test variants

**Purpose:** Track earnings across multiple programs and incentives

---

### Pedigree & Crosses Subarea
**Routes:**
- `/equistats/pedigree/:id` - Pedigree tree
- `/equistats/crosses/:sireId/:damId` - Cross analysis

**RPCs:**
- None (tree traversal)

**Tables:**
- `breeding_records` - Breeding history (backbone)
- `stallion_profiles` - Stallion data
- `entity_profiles` - Mare/foal data
- `term_dictionary` - Pedigree terms
- `term_knowledge` - Term definitions

**Purpose:** Pedigree analysis and cross recommendations

---

### Compare & Insights Subarea
**Routes:**
- `/equistats/compare` - Multi-horse comparison
- `/equistats/insights` - Market insights

**RPCs:**
- None (analytical queries)

**Tables:**
- `discovery_items` - Indexed for search
- `views_coldstart` - View patterns
- `ai_user_analytics` - User behavior
- `business_kpi_snapshots` - Market trends

**Purpose:** Comparative analytics and market insights

---

## 7. Platform Area

### Auth & Identity Subarea
**Routes:**
- `/login` - Login page
- `/signup` - Registration

**RPCs:**
- `get_user_role(user_id)` - Get user role
- `handle_new_user()` - Trigger for new user setup

**Tables:**
- `profiles` - User profiles
- `user_roles` - Role assignments
- `contact_identities` - Contact methods
- `connections` - Social connections
- `user_subscriptions` - Subscription status
- `user_feed_preferences` - Feed settings

**Purpose:** Authentication and identity management

---

### Commerce (Buyer) Subarea
**Routes:**
- `/cart` - Shopping cart
- `/orders/*` - Order tracking (buyer view)

**RPCs:**
- `cart_get(session_id)` - Get cart contents
- `cart_merge_guest_to_user(session_id)` - Merge guest cart
- `cart_upsert_item(listing_id, qty, variant, session_id)` - Add to cart
- `order_start_from_cart(cart_id, idempotency_key)` - Checkout

**Tables:**
- `shopping_carts` - Cart records
- `shopping_cart_items` - Cart items
- `orders` - Orders
- `order_line_items` - Order items
- `payments` - Payment records

**Purpose:** Buyer shopping and checkout

---

### Content & Taxonomy Subarea
**Routes:**
- None (service layer)

**RPCs:**
- None (CRUD operations)

**Tables:**
- `media` - Media files
- `media_entities` - Entity links
- `taxonomies` - Taxonomy structure
- `taxonomy_values` - Taxonomy data
- `content_flags` - Content moderation

**Purpose:** Media management and content categorization

---

### Telemetry & Limits Subarea
**Routes:**
- None (service layer)

**RPCs:**
- `check_rate_limit(scope, limit, window_sec)` - Rate limiting
- `log_usage_event_v2(session_id, event_type, ...)` - Event tracking

**Tables:**
- `idempotency_keys` - Duplicate prevention
- `idempotency_log` - Idempotency history
- `rate_limit_counters` - Rate limit tracking
- `usage_events` - Analytics events
- `voice_post_rate_limits` - Voice post limits

**Purpose:** Platform telemetry, rate limiting, and analytics

---

## 8. Profile Area

### My Profile Subarea
**Routes:**
- `/profile` - User's own profile page

**RPCs:**
- None (CRUD on profile)

**Tables:**
- `profiles` - User profile data
- `profile_badges` - Achievement badges
- `user_ui_prefs` - UI preferences
- `favorite_entities` - Favorited entities
- `saved_items` - Saved marketplace items
- `user_subscriptions` - Subscription data
- `user_feed_preferences` - Feed settings

**Purpose:** Personal profile management

---

## Route Aliases & Normalization

### Defined Aliases
```javascript
{
  '/entrant': '/entries',           // Legacy participant routes
  '/dashboard': '/workspace',        // Legacy dashboard
  '/incentives/dashboard': '/workspace',
  '/crm': '/workspace'
}
```

### Route Families (Collapsed)
Routes under these heads are collapsed to `/<head>/*`:
- `/events/*`
- `/marketplace/*`
- `/messages/*`
- `/orders/*`
- `/farm/*`
- `/entries/*`
- `/entities/*`
- `/listings/*`
- `/profile/*`
- `/stallions/*`
- `/cart/*`
- `/organizer/*`
- `/workspace/*`

### Category Classification
- **Public**: `/events`, `/marketplace`
- **Private**: `/entries`
- **Organizer**: `/organizer`
- **Workspace**: `/workspace`

---

## Data Flow Examples

### Example 1: Event Entry Flow
1. **Browse**: User visits `/events/:slug` (public)
2. **Enter**: Clicks "Enter" → `/events/:slug/enter` (auth gate)
3. **Submit**: Calls `entry_submit(class_id, rider_user_id, horse_entity_id)`
4. **Track**: Entry appears in `/entries` (private)
5. **Manage**: Organizer sees in `/organizer/events/:id/manage`

### Example 2: Marketplace Purchase
1. **Browse**: User visits `/marketplace/*` (public)
2. **Add to Cart**: Calls `cart_upsert_item(listing_id, qty)`
3. **Checkout**: Calls `order_start_from_cart(cart_id)`
4. **Track**: Buyer sees in `/orders/*` (private)
5. **Fulfill**: Seller sees in `/workspace/:entityId/orders`

### Example 3: Workspace Context Switch
1. **Personal**: User at `/workspace/personal/dashboard`
2. **Switch**: Selects "Acme Farm" from picker
3. **Redirect**: → `/workspace/:acmeFarmId/dashboard`
4. **Context**: All modules (CRM, listings, orders) now scoped to Acme Farm
5. **Permissions**: Checked via `entity_members` table

---

## Security Model

### RLS Policies
All tables have Row-Level Security enabled with policies based on:
- `auth.uid()` - Current user ID
- `has_role(user_id, role)` - Role check function
- `entity_members` - Multi-user entity access
- `is_admin()` - Admin bypass

### Key Security Functions
```sql
-- Check if user has specific role
has_role(_user_id uuid, _role app_role) returns boolean

-- Check if user is admin
is_admin(_user_id uuid) returns boolean

-- Check if user is super admin
is_super_admin(_user_id uuid) returns boolean

-- Check if user is hidden from admin view
is_user_hidden_from_admin(_user_id uuid, _admin_id uuid) returns boolean
```

### Permission Patterns
1. **Owner-only**: `auth.uid() = owner_user_id`
2. **Entity member**: `entity_id IN (SELECT entity_id FROM entity_members WHERE user_id = auth.uid())`
3. **Admin override**: `is_admin(auth.uid()) OR (auth.uid() = owner_user_id)`
4. **Public read, owner write**: Separate SELECT and INSERT/UPDATE/DELETE policies

---

## Feature Flag Integration

### Capability Check
```typescript
// Check if workspace has feature enabled
const hasFeature = useFeatureFlag('workspace_crm');

// Conditionally render module
{hasFeature && <CRMModule entityId={currentEntityId} />}
```

### Module Toggles
Each workspace module can be enabled/disabled via:
- `feature_flags` table
- `account_capabilities` table
- `entitlement_overrides` table

### Dynamic Loading
```typescript
// Load module only if entitled
const module = await import(`./modules/${moduleId}`);
```

---

## Migration Strategy

### Phase 1: Alias Support (✅ Complete)
- Route aliases defined
- Scanner recognizes legacy routes
- No breaking changes

### Phase 2: Workspace Foundation (Next)
- Create workspace picker component
- Implement context switching
- Add workspace summary RPC

### Phase 3: Module Migration
- Migrate CRM to workspace context
- Migrate Listings to workspace context
- Migrate Orders to workspace context
- Add feature flag checks

### Phase 4: EquiStats Launch
- Build horse performance views
- Implement pedigree tree
- Add earnings aggregation
- Launch public/private views

---

## Open Questions & Next Steps

### Implementation Questions
1. ✅ Use `/workspace/:entityId` pattern for entity context
2. ✅ Keep `/entities/:id` for public entity pages
3. ✅ Surface events in both Discovery and Events areas
4. ✅ Notifications in header/widgets only (no route)
5. ✅ `breeding_records` as pedigree backbone

### Next Immediate Steps
1. Create workspace picker component
2. Implement `get_user_workspaces()` RPC
3. Build workspace context provider
4. Add workspace routing to main app
5. Create EquiStats landing page

### Future Considerations
- Multi-workspace sessions (open multiple tabs)
- Workspace-level feature subscriptions
- Cross-workspace data sharing
- EquiStats premium tier

---

## Appendix: Full Table List

### Admin Tables (10)
- admin_audit, admin_audit_log, entitlement_overrides, entitlement_override_audit, feature_catalog, feature_flags, feature_locations, features, plan_entitlements, rpc_observations

### AI Tables (28)
- ai_action_ledger, ai_blocklist, ai_change_approvals, ai_change_proposals, ai_consent, ai_feedback, ai_global_knowledge, ai_global_patterns, ai_hypotheses, ai_interaction_log, ai_knower_access_log, ai_messages, ai_model_registry, ai_policy_config, ai_policy_rules, ai_proactive_log, ai_promotion_audit, ai_promotion_queue, ai_proposals, ai_selector_catalog, ai_selector_memory, ai_sessions, ai_triggers, ai_user_analytics, ai_user_consent, ai_user_memory, ai_user_privacy, knowledge_chunks, knowledge_items, memory_links, memory_share_requests, rocker_campaign_audience, rocker_campaigns, rocker_conversations, rocker_notifications

### Business Tables (8)
- businesses, business_kpi_snapshots, business_team, capability_gaps, user_shortcuts, user_ui_prefs

### Calendar Tables (8)
- calendar_collection_members, calendar_collection_shares, calendar_collections, calendar_event_attendees, calendar_event_reminders, calendar_events, calendar_shares, calendars

### Commerce Tables (12)
- commission_ledger, idempotency_keys, idempotency_log, ledger_entries, order_line_items, orders, payments, payouts, settlement_batches, shopping_cart_items, shopping_carts

### Content Tables (9)
- content_flags, media, media_entities, posts, post_drafts, post_reshares, post_saves, post_tags, post_targets

### CRM Tables (6)
- crm_activities, crm_contacts, crm_events, crm_events_* (partitioned)

### Entity Tables (17)
- boarders, breeding_records, claim_bounties, claim_events, contributors, entities, entity_claims, entity_ingest_log, entity_members, entity_profiles, entity_profiles_* (partitioned), entity_ui_prefs, favorite_entities, saved_items, stallion_profiles

### Events Tables (11)
- draws, entries, entry_checkin_log, event_classes, events, live_streams, results, result_flags, stalls_rv_inventory, stalls_rv_reservations, tour_schedules

### Farm Tables (4)
- care_plans, farm_horses, tasks, time_windows

### Feed Tables (4)
- feed_hides, horse_feed, views_coldstart

### Incentives Tables (7)
- bounty_tasks, incentive_nominations, incentives, price_test_variants, price_tests, promotion_redemptions, promotion_targets, promotions

### Marketplace Tables (5)
- discovery_items, dynamic_categories, listing_taxonomy, marketplace_listings, taxonomies, taxonomy_values

### Messaging Tables (2)
- conversation_sessions, messages

### Notifications Tables (4)
- notification_prefs, notification_receipts, notifications, outbox

### Platform Tables (11)
- affiliate_subscriptions, billing_plans, connections, contact_identities, leaderboard_entries, profile_badges, profiles, rate_limit_counters, usage_events, user_feed_preferences, user_roles, user_subscriptions, voice_post_rate_limits

### Taxonomy Tables (3)
- term_dictionary, term_knowledge

**Total Tables**: ~150+ (including partitioned variants)

---

## Document History
- **2025-01-18**: Initial comprehensive mapping
- **Next Review**: After workspace implementation

**Maintained by**: Platform Architecture Team  
**Questions**: Contact via `/workspace/:entityId/messages`
