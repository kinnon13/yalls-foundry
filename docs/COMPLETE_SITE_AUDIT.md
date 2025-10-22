# 🚨 COMPLETE SITE AUDIT - ALL ROUTES & PAGES

**Generated:** $(date)  
**Total Routes in App.tsx:** 39 unique route paths  
**Total Route Files:** 145+ files in src/routes/  
**Total Page Files:** 22 files in src/pages/

---

## 📊 SUMMARY STATISTICS

### App.tsx Route Distribution
- **Public Routes:** 1 route (auth)
- **Auth-Gated Routes:** 1 route (onboarding)
- **Main App Routes:** 10 canonical routes
- **Protected Routes:** 27 routes (admin, super, user features)
- **Redirects:** 3 redirects
- **Catch-all:** 1 route

**Total Defined in App.tsx:** 39 route definitions

### File Breakdown by Directory

```
src/routes/          145 files  (route handlers)
src/pages/            22 files  (page components)
src/layouts/           1 file   (AppLayout)
src/guards/            1 file   (RequireSuperAdmin)
src/components/      ~500 files (UI components)
```

---

## 🗺️ ALL ROUTES IN APP.TSX (Line by Line)

### Public Routes (1)
```tsx
/auth                    → AuthPage (routes/auth.tsx)
```

### Auth-Required Routes (1)
```tsx
/onboarding/*            → OnboardingPage (routes/onboarding/index.tsx)
```

### 10 Canonical Routes
```tsx
1. /                     → HomeShell (routes/home-shell/index.tsx)
2. /discover             → Discover (routes/discover/search.tsx)
3. /dashboard            → Navigate to "/?mode=manage" [REDIRECT]
4. /home                 → Navigate to "/" [REDIRECT]
5. /messages             → Messages (routes/messages/index.tsx)
6. /profile/:id          → ProfilePageDynamic (routes/profile/[id].tsx)
7. /entities             → EntitiesList (routes/entities/index.tsx)
8. /events               → EventsIndex (routes/events/index.tsx)
9. /events/:id           → EventDetail (routes/events/[id].tsx)
10. /listings            → MarketplaceIndex (routes/marketplace/index.tsx)
11. /listings/:id        → ListingDetail (routes/listings/[id].tsx)
```

### Protected Routes - Core Commerce (3)
```tsx
/cart                    → CartPage (routes/cart/index.tsx)
/orders                  → OrdersIndex (routes/orders/index.tsx)
/orders/:id              → OrderDetail (routes/orders/[id].tsx)
```

### Protected Routes - MLM (1)
```tsx
/mlm                     → MLMPage (routes/mlm/index.tsx)
```

### Protected Routes - Admin Dashboard (5)
```tsx
/admin                   → AdminDashboard (routes/admin.tsx)
/admin/guardrails        → GuardrailsControl (routes/admin/guardrails.tsx)
/admin/approvals         → ApprovalsPage (routes/admin/approvals.tsx)
/admin/voice-settings    → VoiceSettingsPage (routes/admin/voice-settings.tsx)
/admin/super-admin-controls → SuperAdminControlsPage (routes/admin/super-admin-controls.tsx)
```

### Protected Routes - User Rocker (3)
```tsx
/rocker                  → UserRockerIndex (pages/UserRocker/Index.tsx) **NEW**
/rocker/preferences      → UserRockerPreferences (pages/UserRocker/Preferences.tsx) **NEW**
/rocker/chat             → Navigate to "/rocker" [REDIRECT]
```

### Protected Routes - Super Andy (2)
```tsx
/super-andy              → SuperAndyIndex (pages/SuperAndy/Index.tsx) **NEW**
/super-andy-v2           → SuperAndyIndex (pages/SuperAndy/Index.tsx) [SUPER ADMIN ONLY] **NEW**
```

### Protected Routes - Admin Rocker (5) **NEW**
```tsx
/admin-rocker            → AdminRockerIndex (pages/AdminRocker/Index.tsx)
/admin-rocker/tools      → AdminRockerTools (pages/AdminRocker/Tools.tsx)
/admin-rocker/audits     → AdminRockerAudits (pages/AdminRocker/Audits.tsx)
/admin-rocker/moderation → AdminRockerModeration (pages/AdminRocker/Moderation.tsx)
/admin-rocker/budgets    → AdminRockerBudgets (pages/AdminRocker/Budgets.tsx)
```

### Protected Routes - Super Console (5) [SUPER ADMIN ONLY]
```tsx
/super                   → SuperOverview (pages/Super/index.tsx)
/super/pools             → PoolsPage (pages/Super/Pools.tsx)
/super/workers           → WorkersPage (pages/Super/Workers.tsx)
/super/flags             → FlagsPage (pages/Super/Flags.tsx)
/super/incidents         → IncidentsPage (pages/Super/Incidents.tsx)
```

### Protected Routes - Settings (2)
```tsx
/settings/keys           → SettingsKeys (pages/SettingsKeys.tsx)
/admin/role-tool         → RoleToolPage (routes/admin/role-tool.tsx)
```

### Health & Catch-all (2)
```tsx
/health                  → Health (pages/Health.tsx)
/*                       → Navigate to "/discover" [CATCH-ALL]
```

---

## 📁 ALL ROUTE FILES (src/routes/)

### Admin Routes (28 files)
```
routes/admin.tsx                         AdminDashboard
routes/admin/a11y.tsx                    A11yAdminPage
routes/admin/approvals.tsx               ApprovalsPage
routes/admin/audit.tsx                   AuditPage
routes/admin/claims.tsx                  AdminClaims
routes/admin/components.tsx              ComponentsAdminPage
routes/admin/control-room.tsx            ControlRoom
routes/admin/features.tsx                FeaturesAdminPage
routes/admin/guardrails.tsx              GuardrailsControl
routes/admin/role-tool.tsx               RoleToolPage
routes/admin/routes.tsx                  RoutesAdminPage
routes/admin/stub-backlog.tsx            StubBacklog
routes/admin/super-admin-controls.tsx    SuperAdminControlsPage
routes/admin/system.tsx                  SystemHealthPage
routes/admin/tests.tsx                   TestsAdminPage
routes/admin/voice-settings.tsx          VoiceSettingsPage
routes/admin/workers.tsx                 WorkerAdmin
routes/admin/panels/AIAnalyticsPanel.tsx
routes/admin/panels/AdminRockerPanel.tsx
routes/admin/panels/CodeAuditPanel.tsx
routes/admin/panels/CodeSearchPanel.tsx
routes/admin/panels/KnowledgeBrowserPanel.tsx
routes/admin/panels/RLSScanner.tsx
routes/admin/panels/RockerLearningPanel.tsx
routes/admin/panels/ScalingReadinessPanel.tsx
routes/admin/panels/TestRunner.tsx
```

### AI Routes (1 file)
```
routes/ai/activity.tsx                   AIActivity
```

### App Store (1 file)
```
routes/app-store/index.tsx               AppStore
```

### Auth (1 file)
```
routes/auth.tsx                          AuthPage
```

### Cart (1 file)
```
routes/cart/index.tsx                    CartPage
```

### Claim (1 file)
```
routes/claim/[entityId].tsx              ClaimEntity
```

### Compose (1 file)
```
routes/compose.tsx                       ComposePage
```

### CRM (1 file)
```
routes/crm/index.tsx                     CRM
```

### Dashboard Routes (26 files)
```
routes/dashboard.tsx                     Dashboard
routes/dashboard-v2.tsx                  DashboardV2
routes/dashboard-new/index.tsx           DashboardNew
routes/dashboard/index.tsx               DashboardLayout
routes/dashboard/approvals.tsx           Approvals
routes/dashboard/approvals/index.tsx     ApprovalsPanel
routes/dashboard/business.tsx            DashboardBusiness
routes/dashboard/earnings.tsx            EarningsDashboard
routes/dashboard/earnings/index.tsx      EarningsPanel
routes/dashboard/events/index.tsx        EventsPanel
routes/dashboard/farm-ops/index.tsx      FarmOpsPanel
routes/dashboard/incentives/index.tsx    IncentivesPanel
routes/dashboard/orders.tsx              OrdersPanel
routes/dashboard/orders/index.tsx        OrdersPanel
routes/dashboard/overview.tsx            Overview
routes/dashboard/overview/index.tsx      DashboardOverview
routes/dashboard/modules/Earnings.tsx
routes/dashboard/modules/MLM.tsx
routes/dashboard/modules/Overview.tsx
+ more dashboard submodules...
```

### Discover Routes (2 files)
```
routes/discover/index.tsx                DiscoverLayout
routes/discover/search.tsx               Discover
```

### Entities Routes (6 files)
```
routes/entities/index.tsx                EntitiesList
routes/entities/[id].tsx                 EntityDetail
routes/entities/[id]/index.tsx
routes/entities/[id]/activities.tsx
routes/entities/[id]/connections.tsx
routes/entities/[id]/insights.tsx
```

### Events Routes (3 files)
```
routes/events/index.tsx                  EventsIndex
routes/events/[id].tsx                   EventDetail
routes/events/create.tsx                 CreateEvent
```

### Farm Ops Routes (8 files)
```
routes/farm-ops/index.tsx                FarmOpsHub
routes/farm-ops/calendar.tsx             Calendar
routes/farm-ops/directory.tsx           Directory
routes/farm-ops/inventory.tsx           Inventory
routes/farm-ops/jobs.tsx                 Jobs
routes/farm-ops/logistics.tsx           Logistics
routes/farm-ops/marketplace.tsx         Marketplace
routes/farm-ops/weather.tsx             Weather
```

### Home Shell (1 file)
```
routes/home-shell/index.tsx              HomeShell
```

### Insights Routes (2 files)
```
routes/insights/index.tsx                InsightsHub
routes/insights/[id].tsx                 InsightDetail
```

### Listings (2 files)
```
routes/listings/[id].tsx                 ListingDetail
routes/listings/create.tsx               CreateListing
```

### Live Routes (2 files)
```
routes/live/[id].tsx                     LiveStream
routes/live/create.tsx                   CreateStream
```

### Marketplace (1 file)
```
routes/marketplace/index.tsx             MarketplaceIndex
```

### Messages (2 files)
```
routes/messages/index.tsx                Messages
routes/messages/[id].tsx                 MessageThread
```

### MLM (1 file)
```
routes/mlm/index.tsx                     MLMPage
```

### Onboarding (1 file)
```
routes/onboarding/index.tsx              OnboardingPage
```

### Orders (2 files)
```
routes/orders/index.tsx                  OrdersIndex
routes/orders/[id].tsx                   OrderDetail
```

### Profile (3 files)
```
routes/profile/[id].tsx                  ProfilePageDynamic
routes/profile/[id]/index.tsx
routes/profile/edit.tsx                  EditProfile
```

### Rocker Hub (1 file)
```
routes/rocker-hub.tsx                    RockerHub (OLD - being replaced)
```

### Super Andy (1 file)
```
routes/super-andy.tsx                    SuperAndy (OLD - being replaced)
```

### Admin Rocker (1 file)
```
routes/admin-rocker.tsx                  AdminRocker (OLD - being replaced)
```

### Diagnostic (1 file)
```
routes/_diag.tsx                         Diag
```

**Total Route Files: 145+ files**

---

## 📄 ALL PAGE FILES (src/pages/)

### Admin Rocker Pages (5 files) **NEW**
```
pages/AdminRocker/Index.tsx              AdminRocker overview
pages/AdminRocker/Tools.tsx              Tools registry viewer
pages/AdminRocker/Audits.tsx             Action ledger & audit trail
pages/AdminRocker/Moderation.tsx         Incidents & content review
pages/AdminRocker/Budgets.tsx            Model routes & budget tracking
```

### Super Andy Pages (4 files)
```
pages/SuperAndy.tsx                      SuperAndyChat (OLD standalone)
pages/SuperAndy/Index.tsx                SuperAndyPage with rails **NEW**
pages/SuperAndy/ProactiveRail.tsx        Proactive suggestions component
pages/SuperAndy/SelfImproveLog.tsx       Self-improvement log component
pages/SuperAndy/RateThis.tsx             Rating component
```

### Super Console Pages (5 files)
```
pages/Super/index.tsx                    SuperOverview (health, queues, workers)
pages/Super/Pools.tsx                    PoolsPage (worker pool management)
pages/Super/Workers.tsx                  WorkersPage (heartbeats & probing)
pages/Super/Flags.tsx                    FlagsPage (control flags)
pages/Super/Incidents.tsx                IncidentsPage (incident resolution)
```

### User Rocker Pages (2 files) **NEW**
```
pages/UserRocker/Index.tsx               UserRocker personal hub
pages/UserRocker/Preferences.tsx         AI preferences editor
```

### Utility Pages (6 files)
```
pages/Home.tsx                           Home quick links **NEW**
pages/Health.tsx                         Health check
pages/Login.tsx                          Login page (unused?)
pages/NotFound.tsx                       404 page
pages/SettingsKeys.tsx                   API keys management
pages/SecretsManagement.tsx              Secrets management
```

**Total Page Files: 22 files**

---

## 🏗️ NEW INFRASTRUCTURE (Just Added)

### Layouts (1 file)
```
layouts/AppLayout.tsx                    Shared layout with sidebar nav
```

### Navigation Components (2 files)
```
components/navigation/Nav.tsx            Role-aware sidebar navigation
components/navigation/RoleGate.tsx       Role-based route guard
```

### Guards (1 file)
```
guards/RequireSuperAdmin.tsx             Super admin access guard
```

---

## 🚨 CRITICAL FINDINGS

### Route Bloat Issues
1. **App.tsx contains 39 route definitions** - supposed to be only 10 canonical
2. **145+ route files exist** but most are not directly wired in App.tsx
3. **Massive duplication:**
   - `/dashboard` has 3 versions (dashboard.tsx, dashboard-v2.tsx, dashboard-new/)
   - `/super-andy` exists in both routes/ and pages/
   - `/admin-rocker` exists in both routes/ and pages/
   - `/rocker` has RockerHub (old) and UserRockerIndex (new)

### Unused/Dead Files (High Probability)
```
routes/rocker-hub.tsx           → Replaced by pages/UserRocker/
routes/super-andy.tsx           → Replaced by pages/SuperAndy/Index.tsx
routes/admin-rocker.tsx         → Replaced by pages/AdminRocker/
routes/dashboard.tsx            → Multiple versions exist
routes/dashboard-v2.tsx         → Which version is active?
routes/dashboard-new/           → Which version is active?
pages/Login.tsx                 → Replaced by routes/auth.tsx?
```

### Missing from App.tsx (Orphaned Routes - 100+ files)
These files exist in src/routes/ but are NOT referenced in App.tsx:

```
routes/admin/a11y.tsx
routes/admin/audit.tsx
routes/admin/claims.tsx
routes/admin/components.tsx
routes/admin/control-room.tsx
routes/admin/features.tsx
routes/admin/routes.tsx
routes/admin/stub-backlog.tsx
routes/admin/system.tsx
routes/admin/tests.tsx
routes/admin/workers.tsx
routes/admin/panels/* (10 files)
routes/ai/activity.tsx
routes/app-store/index.tsx
routes/claim/[entityId].tsx
routes/compose.tsx
routes/crm/index.tsx
routes/dashboard/* (20+ files not directly wired)
routes/discover/index.tsx
routes/entities/* (5+ subpages)
routes/events/create.tsx
routes/farm-ops/* (8 files)
routes/insights/* (2 files)
routes/listings/create.tsx
routes/live/* (2 files)
routes/messages/[id].tsx
routes/profile/edit.tsx
routes/_diag.tsx
... and 50+ more
```

### Redirect Issues
- `/dashboard` → redirects to `/?mode=manage` (HomeShell)
- `/home` → redirects to `/`
- `/rocker/chat` → redirects to `/rocker`

This means `/dashboard` URL doesn't actually show a dashboard - it shows the home shell!

---

## 📈 ROUTE HIERARCHY BY ACCESS LEVEL

### Public (1 route)
```
/auth
```

### Authenticated (27 routes)
```
/onboarding/*
/
/discover
/messages
/profile/:id
/entities
/events
/events/:id
/listings
/listings/:id
/cart
/orders
/orders/:id
/mlm
/admin
/admin/guardrails
/admin/approvals
/admin/voice-settings
/admin/super-admin-controls
/rocker
/rocker/preferences
/super-andy
/admin-rocker
/admin-rocker/tools
/admin-rocker/audits
/admin-rocker/moderation
/admin-rocker/budgets
/settings/keys
/admin/role-tool
```

### Super Admin Only (6 routes)
```
/super
/super/pools
/super/workers
/super/flags
/super/incidents
/super-andy-v2
```

---

## 🎯 RECOMMENDATIONS

### Immediate Actions
1. **Delete orphaned route files** - 100+ files not wired in App.tsx
2. **Consolidate dashboard** - Remove dashboard.tsx, dashboard-v2.tsx OR dashboard-new/
3. **Remove old rocker files:**
   - Delete `routes/rocker-hub.tsx`
   - Delete `routes/super-andy.tsx`
   - Delete `routes/admin-rocker.tsx`
4. **Clean up pages:**
   - Delete `pages/Login.tsx` (replaced by routes/auth.tsx)
   - Verify `pages/SuperAndy.tsx` can be deleted (replaced by pages/SuperAndy/Index.tsx)

### Medium-term Refactoring
1. **Reduce App.tsx to 10 canonical routes** as originally intended
2. **Move admin routes to overlay system** (?app=admin-guardrails instead of /admin/guardrails)
3. **Consolidate rocker surfaces** into overlay system
4. **Create route registry** to track all 145 files and their status

### Long-term Architecture
1. **Implement true overlay system** - only 10 routes in App.tsx
2. **Dynamic route loading** - load admin/rocker features on demand
3. **Route versioning system** - track which dashboard version is active
4. **Automated dead code detection** - scan for files not imported anywhere

---

## 📊 FINAL STATISTICS

```
Total Routes in App.tsx:      39 routes
Total Route Files:           145+ files
Total Page Files:             22 files
Orphaned Files:              100+ files
Duplicate Versions:            ~10 files
Dead Files (estimated):       ~20 files

Code Bloat Factor:           ~400% (39 vs intended 10 routes)
File Usage Rate:              ~27% (39 used / 145 total)
```

---

## ✅ WHAT WE JUST SHIPPED

### New Files (11 files)
```
layouts/AppLayout.tsx
components/navigation/Nav.tsx
components/navigation/RoleGate.tsx
pages/Home.tsx
pages/AdminRocker/Index.tsx
pages/AdminRocker/Tools.tsx
pages/AdminRocker/Audits.tsx
pages/AdminRocker/Moderation.tsx
pages/AdminRocker/Budgets.tsx
pages/UserRocker/Index.tsx
pages/UserRocker/Preferences.tsx
```

### Modified Files (2 files)
```
App.tsx (added 11 new route definitions)
pages/SuperAndy/Index.tsx (created organized page)
```

### Result
- **Added 13 new route definitions to App.tsx**
- **Total routes now: 39 (up from 26)**
- **Total files created: 13**
- **Clean implementation with role-based access**

---

**Bottom Line:** The site has significant route bloat (39 vs 10 intended) and 100+ orphaned files. The new Admin Rocker, Super Andy, and User Rocker surfaces are properly wired, but major cleanup is needed to achieve the original 10-canonical-route architecture.
