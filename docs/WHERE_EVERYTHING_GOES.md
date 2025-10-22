# 🎯 WHERE EVERYTHING GOES - COMPREHENSIVE PLAN

**Based on:** ROUTER_CLEANUP_COMPLETE.md, ROUTE_CONSOLIDATION.md, redirects.ts, registry.ts

---

## 📐 THE INTENDED ARCHITECTURE

### App.tsx Should Have EXACTLY 12 Routes
```
1. /                     Home Shell (split panes)
2. /discover             Discover surface
3. /dashboard            Management surface
4. /messages             DM deep link
5. /profile/:id          Profile deep link
6. /entities             Browse entities
7. /events               Events index
8. /events/:id           Event detail
9. /listings             Listings index
10. /listings/:id        Listing detail
11. /cart                Cart checkout
12. /orders              Orders list
13. /orders/:id          Order detail
14. /auth                Auth (public)
15. /onboarding          Onboarding
16. /health              Health check
```

**EVERYTHING ELSE** → Overlay System (`?app=key`)

---

## 🗺️ COMPREHENSIVE FILE MAPPING

### ✅ KEEP IN APP.TSX (16 Routes)

These stay as direct routes because they are:
- The 10 canonical routes
- Auth/onboarding flows
- Deep-linkable details
- Health checks

```tsx
// KEEP THESE IN APP.TSX
/                        → routes/home-shell/index.tsx
/discover                → routes/discover/search.tsx
/dashboard               → routes/dashboard/index.tsx
/messages                → routes/messages/index.tsx
/profile/:id             → routes/profile/[id].tsx
/entities                → routes/entities/index.tsx
/events                  → routes/events/index.tsx
/events/:id              → routes/events/[id].tsx
/listings                → routes/marketplace/index.tsx
/listings/:id            → routes/listings/[id].tsx
/cart                    → routes/cart/index.tsx
/orders                  → routes/orders/index.tsx
/orders/:id              → routes/orders/[id].tsx
/auth                    → routes/auth.tsx
/onboarding/*            → routes/onboarding/index.tsx
/health                  → pages/Health.tsx
```

---

### 🔄 MOVE TO OVERLAY SYSTEM (23 Registered Overlays)

These files stay in routes/ but are accessed via `?app=key` instead of direct routing:

#### Overlay Registry (registry.ts) - 23 Overlays

| Overlay Key | Component File | Current Route | New Access |
|-------------|---------------|---------------|------------|
| `messages` | routes/messages/index.tsx | /messages | `/?app=messages` |
| `marketplace` | routes/marketplace/index.tsx | /marketplace | `/?app=marketplace` |
| `app-store` | routes/app-store/index.tsx | /app-store | `/?app=app-store` |
| `crm` | routes/crm/index.tsx | /crm | `/?app=crm` |
| `profile` | routes/profile/[id].tsx | /profile/:id | `/?app=profile&id=:id` |
| `entities` | routes/entities/index.tsx | /entities | `/?app=entities` |
| `events` | routes/events/index.tsx | /events | `/?app=events` |
| `listings` | routes/listings/new.tsx | /listings/new | `/?app=listings` |
| `business` | routes/dashboard/business.tsx | /dashboard/business | `/?app=business` |
| `producer` | routes/dashboard/business.tsx | - | `/?app=producer` |
| `incentives` | routes/incentives/dashboard.tsx | /incentives | `/?app=incentives` |
| `calendar` | routes/farm/calendar.tsx | /farm/calendar | `/?app=calendar` |
| `activity` | routes/ai/activity.tsx | /ai/activity | `/?app=activity` |
| `analytics` | routes/dashboard/overview.tsx | /dashboard/overview | `/?app=analytics` |
| `favorites` | apps/_placeholder/PlaceholderEntry.tsx | - | `/?app=favorites` |
| `yall-library` | routes/app-store/index.tsx | - | `/?app=yall-library` |
| `cart` | routes/cart/index.tsx | /cart | `/?app=cart` |
| `orders` | routes/orders/index.tsx | /orders | `/?app=orders` |
| `notifications` | routes/notifications.tsx | /notifications | `/?app=notifications` |
| `settings` | routes/dashboard/settings.tsx | /settings | `/?app=settings` |
| `overview` | routes/dashboard/modules/Overview.tsx | /dashboard/overview | `/?app=overview` |
| `earnings` | routes/dashboard/modules/Earnings.tsx | /earnings | `/?app=earnings` |
| `discover` | routes/discover/index.tsx | /discover | `/?app=discover` |
| `farm-ops` | routes/farm/calendar.tsx | /farm/* | `/?app=farm-ops` |
| `mlm` | routes/dashboard/modules/MLM.tsx | /mlm | `/?app=mlm` |

**Action:** Remove these route definitions from App.tsx, keep files, access via overlay system

---

### 🗑️ DELETE - REPLACED FILES (5 Files)

These have direct new replacements:

```bash
rm src/routes/rocker-hub.tsx              # → pages/UserRocker/Index.tsx
rm src/routes/super-andy.tsx              # → pages/SuperAndy/Index.tsx  
rm src/routes/admin-rocker.tsx            # → pages/AdminRocker/Index.tsx
rm src/pages/Login.tsx                    # → routes/auth.tsx
rm src/pages/SuperAndy.tsx                # → pages/SuperAndy/Index.tsx
```

---

### ⚠️ CONSOLIDATE - DASHBOARD VERSIONS (Pick ONE)

Three versions exist. Pick one, delete others:

```bash
# Option A: Keep NEW version
KEEP: routes/dashboard-new/index.tsx
DELETE: routes/dashboard.tsx
DELETE: routes/dashboard-v2.tsx

# Option B: Keep ORIGINAL
KEEP: routes/dashboard.tsx  
DELETE: routes/dashboard-v2.tsx
DELETE: routes/dashboard-new/

# Option C: Keep V2
KEEP: routes/dashboard-v2.tsx
DELETE: routes/dashboard.tsx
DELETE: routes/dashboard-new/
```

**Action Required:** Determine which dashboard is actively used, then delete the others

---

### 📋 DASHBOARD SUBMODULES → MOVE TO OVERLAY

Dashboard submodules should NOT be direct routes. Access via `/?app=key` or `/dashboard?tab=x`:

```
routes/dashboard/approvals.tsx           → /?app=approvals OR /dashboard?tab=approvals
routes/dashboard/approvals/index.tsx     → DELETE (duplicate)
routes/dashboard/business.tsx            → /?app=business
routes/dashboard/earnings.tsx            → /?app=earnings
routes/dashboard/earnings/index.tsx      → DELETE (duplicate)
routes/dashboard/events/index.tsx        → /?app=events
routes/dashboard/farm-ops/index.tsx      → /?app=farm-ops
routes/dashboard/incentives/index.tsx    → /?app=incentives
routes/dashboard/orders.tsx              → /?app=orders
routes/dashboard/orders/index.tsx        → DELETE (duplicate)
routes/dashboard/overview.tsx            → /?app=overview
routes/dashboard/overview/index.tsx      → DELETE (duplicate)
routes/dashboard/settings.tsx            → /?app=settings
routes/dashboard/modules/Earnings.tsx    → /?app=earnings (duplicate)
routes/dashboard/modules/MLM.tsx         → /?app=mlm
routes/dashboard/modules/Overview.tsx    → /?app=overview (duplicate)
```

**Action:** Remove from App.tsx routing, access via overlay or dashboard tabs

---

### 🔧 ADMIN ROUTES → MOVE TO OVERLAY OR DASHBOARD TABS

Admin routes should be overlays or dashboard tabs, not separate routes:

```
routes/admin.tsx                         → /dashboard?tab=admin (KEEP in App.tsx as redirect)
routes/admin/a11y.tsx                    → /dashboard?tab=admin&view=a11y
routes/admin/approvals.tsx               → KEEP in App.tsx (special case)
routes/admin/audit.tsx                   → /dashboard?tab=admin&view=audit
routes/admin/claims.tsx                  → /dashboard?tab=admin&view=claims
routes/admin/components.tsx              → /dashboard?tab=admin&view=components
routes/admin/control-room.tsx            → /dashboard?tab=admin&view=control-room
routes/admin/features.tsx                → /dashboard?tab=admin&view=features
routes/admin/guardrails.tsx              → KEEP in App.tsx (special case)
routes/admin/role-tool.tsx               → KEEP in App.tsx (special case)
routes/admin/routes.tsx                  → /dashboard?tab=admin&view=routes
routes/admin/stub-backlog.tsx            → /dashboard?tab=admin&view=stubs
routes/admin/super-admin-controls.tsx    → KEEP in App.tsx (special case)
routes/admin/system.tsx                  → /dashboard?tab=admin&view=system
routes/admin/tests.tsx                   → /dashboard?tab=admin&view=tests
routes/admin/voice-settings.tsx          → KEEP in App.tsx (special case)
routes/admin/workers.tsx                 → /dashboard?tab=admin&view=workers
```

**Admin Panel Components (10 files):**
```
routes/admin/panels/AIAnalyticsPanel.tsx       → Component for admin dashboard
routes/admin/panels/AdminRockerPanel.tsx       → Component for admin dashboard
routes/admin/panels/CodeAuditPanel.tsx         → Component for admin dashboard
routes/admin/panels/CodeSearchPanel.tsx        → Component for admin dashboard
routes/admin/panels/KnowledgeBrowserPanel.tsx  → Component for admin dashboard
routes/admin/panels/RLSScanner.tsx             → Component for admin dashboard
routes/admin/panels/RockerLearningPanel.tsx    → Component for admin dashboard
routes/admin/panels/ScalingReadinessPanel.tsx  → Component for admin dashboard
routes/admin/panels/TestRunner.tsx             → Component for admin dashboard
```

**Action:** Keep as components, load in admin dashboard, not separate routes

---

### 🏗️ SUPER CONSOLE & ROCKER → KEEP IN APP.TSX

These are special admin/super surfaces that should stay as direct routes:

```tsx
// NEW ROCKER/ANDY SURFACES - KEEP IN APP.TSX
/rocker                  → pages/UserRocker/Index.tsx (User hub)
/rocker/preferences      → pages/UserRocker/Preferences.tsx
/super-andy              → pages/SuperAndy/Index.tsx (AI assistant)
/super-andy-v2           → pages/SuperAndy/Index.tsx [SUPER ADMIN]

/admin-rocker            → pages/AdminRocker/Index.tsx
/admin-rocker/tools      → pages/AdminRocker/Tools.tsx
/admin-rocker/audits     → pages/AdminRocker/Audits.tsx
/admin-rocker/moderation → pages/AdminRocker/Moderation.tsx
/admin-rocker/budgets    → pages/AdminRocker/Budgets.tsx

/super                   → pages/Super/index.tsx [SUPER ADMIN]
/super/pools             → pages/Super/Pools.tsx [SUPER ADMIN]
/super/workers           → pages/Super/Workers.tsx [SUPER ADMIN]
/super/flags             → pages/Super/Flags.tsx [SUPER ADMIN]
/super/incidents         → pages/Super/Incidents.tsx [SUPER ADMIN]
```

**Reason:** These are distinct workspaces, not overlays. Keep as direct routes.

---

### 🌾 FARM OPS SUITE → OVERLAY SYSTEM

Farm ops files exist but should be accessed via overlay:

```
routes/farm-ops/index.tsx          → /?app=farm-ops (hub)
routes/farm/calendar.tsx           → /?app=calendar
routes/farm/directory.tsx          → /dashboard?tab=farm&view=directory
routes/farm/inventory.tsx          → /dashboard?tab=farm&view=inventory
routes/farm/jobs.tsx               → /dashboard?tab=farm&view=jobs
routes/farm/logistics.tsx          → /dashboard?tab=farm&view=logistics
routes/farm/marketplace.tsx        → /dashboard?tab=farm&view=marketplace
routes/farm/weather.tsx            → /dashboard?tab=farm&view=weather
```

**Action:** Remove from App.tsx, access via `/?app=farm-ops` or dashboard tabs

---

### 📊 ENTITIES SUBPAGES → OVERLAY OR TABS

Entity detail pages should be loaded within entity detail route:

```
routes/entities/[id].tsx                   → /entities/:id (KEEP in App.tsx)
routes/entities/[id]/index.tsx             → Component for entity detail
routes/entities/[id]/activities.tsx        → Component for entity detail tabs
routes/entities/[id]/connections.tsx       → Component for entity detail tabs
routes/entities/[id]/insights.tsx          → Component for entity detail tabs
```

**Action:** Keep [id].tsx route, others are tab components

---

### 🎉 EVENTS & LISTINGS SUBPAGES → COMPONENTS

Events and listings creation should be overlays or tabs:

```
routes/events/create.tsx           → /?app=events&action=create OR /events?action=create
routes/listings/create.tsx         → /?app=listings&action=create OR /listings?action=create
```

---

### 💬 MESSAGES & PROFILE SUBPAGES

```
routes/messages/[id].tsx           → Component for message thread (not separate route)
routes/profile/edit.tsx            → /?app=profile&action=edit OR /profile?action=edit
```

---

### 🔍 DISCOVER & LIVE

```
routes/discover/index.tsx          → /discover (KEEP in App.tsx)
routes/live/[id].tsx               → /events/:id?type=live OR /?app=live&id=:id
routes/live/create.tsx             → /events?action=create&type=live
```

---

### 💡 INSIGHTS

```
routes/insights/index.tsx          → /?app=insights
routes/insights/[id].tsx           → /?app=insights&id=:id
```

---

### 🎁 INCENTIVES

```
routes/incentives/dashboard.tsx    → /?app=incentives (already in overlay registry)
```

---

### 🔗 ORPHANED FILES TO DELETE OR INTEGRATE

These files exist but have no clear purpose:

```
routes/_diag.tsx                   → /diag (diagnostic tool - DELETE or keep for debugging)
routes/ai/activity.tsx             → /?app=activity (already in overlay registry)
routes/app-store/index.tsx         → /?app=app-store (already in overlay registry)
routes/claim/[entityId].tsx        → /entities?claim=:entityId (redirect exists)
routes/compose.tsx                 → /?app=compose OR /discover?action=compose
routes/crm/index.tsx               → /?app=crm (already in overlay registry)
routes/notifications.tsx           → /?app=notifications (already in overlay registry)
```

**Action:** Most are already in overlay registry, remove from direct routing

---

## 📊 FINAL FILE DISPOSITION

### Keep in App.tsx (16 routes)
```
✅ /                      Home shell
✅ /discover              Discover
✅ /dashboard             Dashboard hub
✅ /messages              Messages deep link
✅ /profile/:id           Profile deep link
✅ /entities              Entities browse
✅ /events                Events index
✅ /events/:id            Event detail
✅ /listings              Listings index
✅ /listings/:id          Listing detail
✅ /cart                  Cart
✅ /orders                Orders list
✅ /orders/:id            Order detail
✅ /auth                  Auth
✅ /onboarding/*          Onboarding
✅ /health                  Health check
```

### Keep as Admin/Super Routes (15 routes)
```
✅ /rocker                User Rocker hub
✅ /rocker/preferences    User preferences
✅ /super-andy            Super Andy AI
✅ /super-andy-v2         Super Andy (admin)
✅ /admin-rocker          Admin Rocker hub
✅ /admin-rocker/tools    Admin tools
✅ /admin-rocker/audits   Admin audits
✅ /admin-rocker/moderation Admin moderation
✅ /admin-rocker/budgets  Admin budgets
✅ /super                 Super console
✅ /super/pools           Worker pools
✅ /super/workers         Worker heartbeats
✅ /super/flags           Control flags
✅ /super/incidents       Incidents
✅ /admin/*               5 special admin routes
```

### Move to Overlay System (23 overlays)
```
🔄 routes/messages/       → /?app=messages
🔄 routes/marketplace/    → /?app=marketplace
🔄 routes/app-store/      → /?app=app-store
🔄 routes/crm/            → /?app=crm
🔄 routes/farm/*          → /?app=farm-ops or calendar
🔄 routes/ai/activity     → /?app=activity
🔄 routes/incentives/     → /?app=incentives
🔄 routes/dashboard/business → /?app=business
🔄 routes/dashboard/earnings → /?app=earnings
🔄 routes/dashboard/overview → /?app=overview
🔄 ... and 13 more (see overlay registry)
```

### Delete - Replaced or Duplicate (15+ files)
```
❌ routes/rocker-hub.tsx
❌ routes/super-andy.tsx
❌ routes/admin-rocker.tsx
❌ pages/Login.tsx
❌ pages/SuperAndy.tsx
❌ routes/dashboard.tsx OR dashboard-v2.tsx (keep one)
❌ routes/dashboard/*/index.tsx (duplicates)
❌ routes/claim/[entityId].tsx (redirect handles it)
❌ ... and more duplicates
```

---

## 🎯 TARGET STATE

### App.tsx Routes
```
Total Routes: 31
- 16 core routes (10 canonical + auth + health + subroutes)
- 15 admin/super routes (rocker/andy/console surfaces)
- 0 overlay routes (handled by overlay system)

Reduction: 39 → 31 routes (21% reduction)
```

### Files
```
Total Route Files: ~60 files (from 145)
- 31 route files wired in App.tsx
- 23 route files accessed via overlay system
- ~85 files deleted or consolidated
```

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Safe Deletions (5 minutes)
```bash
rm src/routes/rocker-hub.tsx
rm src/routes/super-andy.tsx
rm src/routes/admin-rocker.tsx
rm src/pages/Login.tsx
rm src/pages/SuperAndy.tsx
```

### Phase 2: Dashboard Consolidation (15 minutes)
1. Determine active dashboard version
2. Delete unused versions
3. Update imports in App.tsx

### Phase 3: Remove Overlay Routes from App.tsx (30 minutes)
1. Remove 23 overlay routes from App.tsx
2. Verify overlay system handles them
3. Test each overlay opens correctly

### Phase 4: Clean Up Orphaned Files (45 minutes)
1. Remove admin panel routes from App.tsx
2. Delete farm ops routes (keep as overlays)
3. Remove dashboard submodule routes
4. Delete entity/event/listing subpage routes

### Phase 5: Testing (30 minutes)
1. Test all 31 remaining routes load
2. Test all 23 overlays open via ?app=
3. Verify redirects work for legacy URLs
4. Run Playwright tests

---

**Status:** Complete architectural plan created. Everything mapped to its intended location based on architecture docs.
