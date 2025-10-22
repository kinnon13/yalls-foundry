# 🗺️ COMPLETE ROUTES VISUAL MAP

## App.tsx Route Tree (39 Total Routes)

```
ROOT (BrowserRouter)
│
├─ PUBLIC ROUTES (1)
│  └─ /auth                                    AuthPage
│
├─ AUTH-REQUIRED (1)
│  └─ /onboarding/*                            OnboardingPage (subroutes)
│
├─ ONBOARDING-COMPLETE ROUTES (37)
│  │
│  ├─ HOME & DISCOVER (3)
│  │  ├─ /                                     HomeShell
│  │  ├─ /discover                             Discover
│  │  └─ /dashboard → /?mode=manage            [REDIRECT]
│  │
│  ├─ SOCIAL (2)
│  │  ├─ /messages                             Messages
│  │  └─ /profile/:id                          ProfilePageDynamic
│  │
│  ├─ ENTITIES & EVENTS (3)
│  │  ├─ /entities                             EntitiesList
│  │  ├─ /events                               EventsIndex
│  │  └─ /events/:id                           EventDetail
│  │
│  ├─ MARKETPLACE (2)
│  │  ├─ /listings                             MarketplaceIndex
│  │  └─ /listings/:id                         ListingDetail
│  │
│  ├─ COMMERCE (3)
│  │  ├─ /cart                                 CartPage
│  │  ├─ /orders                               OrdersIndex
│  │  └─ /orders/:id                           OrderDetail
│  │
│  ├─ MLM (1)
│  │  └─ /mlm                                  MLMPage
│  │
│  ├─ ADMIN DASHBOARD (5)
│  │  ├─ /admin                                AdminDashboard
│  │  ├─ /admin/guardrails                     GuardrailsControl
│  │  ├─ /admin/approvals                      ApprovalsPage
│  │  ├─ /admin/voice-settings                 VoiceSettingsPage
│  │  └─ /admin/super-admin-controls           SuperAdminControlsPage
│  │
│  ├─ USER ROCKER (3) **NEW**
│  │  ├─ /rocker                               UserRockerIndex (Hub)
│  │  ├─ /rocker/preferences                   UserRockerPreferences
│  │  └─ /rocker/chat → /rocker                [REDIRECT]
│  │
│  ├─ SUPER ANDY (2) **NEW**
│  │  ├─ /super-andy                           SuperAndyIndex (Chat + Rails)
│  │  └─ /super-andy-v2                        SuperAndyIndex [SUPER ADMIN]
│  │
│  ├─ ADMIN ROCKER (5) **NEW**
│  │  ├─ /admin-rocker                         AdminRockerIndex (Overview)
│  │  ├─ /admin-rocker/tools                   AdminRockerTools
│  │  ├─ /admin-rocker/audits                  AdminRockerAudits
│  │  ├─ /admin-rocker/moderation              AdminRockerModeration
│  │  └─ /admin-rocker/budgets                 AdminRockerBudgets
│  │
│  ├─ SUPER CONSOLE (5) [SUPER ADMIN]
│  │  ├─ /super                                SuperOverview
│  │  ├─ /super/pools                          PoolsPage
│  │  ├─ /super/workers                        WorkersPage
│  │  ├─ /super/flags                          FlagsPage
│  │  └─ /super/incidents                      IncidentsPage
│  │
│  ├─ SETTINGS (2)
│  │  ├─ /settings/keys                        SettingsKeys
│  │  └─ /admin/role-tool                      RoleToolPage
│  │
│  └─ UTILITY (2)
│     ├─ /health                               Health
│     └─ /* → /discover                        [CATCH-ALL]
```

---

## Route Count by Category

| Category | Routes | Notes |
|----------|--------|-------|
| Public | 1 | Auth only |
| Auth Required | 1 | Onboarding |
| Home & Discover | 3 | Includes redirect |
| Social | 2 | Messages + Profile |
| Entities & Events | 3 | Browse + Details |
| Marketplace | 2 | Listings |
| Commerce | 3 | Cart + Orders |
| MLM | 1 | Network |
| Admin Dashboard | 5 | Core admin |
| User Rocker | 3 | **NEW** Personal hub |
| Super Andy | 2 | **NEW** AI assistant |
| Admin Rocker | 5 | **NEW** Admin AI workspace |
| Super Console | 5 | Super admin only |
| Settings | 2 | Keys + Tools |
| Utility | 2 | Health + Catch-all |
| **TOTAL** | **39** | **vs intended 10** |

---

## Access Level Breakdown

### 🌐 Public Access (1 route)
```
/auth
```

### 🔐 Authenticated Users (21 routes)
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
/rocker
/rocker/preferences
/super-andy
/settings/keys
/health
/admin
/admin/role-tool
```

### 👔 Admin Users (10 routes)
```
All authenticated routes +
/admin/guardrails
/admin/approvals
/admin/voice-settings
/admin/super-admin-controls
/admin-rocker
/admin-rocker/tools
/admin-rocker/audits
/admin-rocker/moderation
/admin-rocker/budgets
```

### 👑 Super Admin (6 routes)
```
All admin routes +
/super
/super/pools
/super/workers
/super/flags
/super/incidents
/super-andy-v2
```

---

## File Location Map

### Routes in App.tsx → Actual Files

```
ROUTES DIRECTORY (routes/)
├─ auth.tsx                      → /auth
├─ onboarding/index.tsx          → /onboarding/*
├─ home-shell/index.tsx          → /
├─ discover/search.tsx           → /discover
├─ messages/index.tsx            → /messages
├─ profile/[id].tsx              → /profile/:id
├─ entities/index.tsx            → /entities
├─ events/index.tsx              → /events
├─ events/[id].tsx               → /events/:id
├─ marketplace/index.tsx         → /listings
├─ listings/[id].tsx             → /listings/:id
├─ cart/index.tsx                → /cart
├─ orders/index.tsx              → /orders
├─ orders/[id].tsx               → /orders/:id
├─ mlm/index.tsx                 → /mlm
├─ admin.tsx                     → /admin
├─ admin/guardrails.tsx          → /admin/guardrails
├─ admin/approvals.tsx           → /admin/approvals
├─ admin/voice-settings.tsx      → /admin/voice-settings
├─ admin/super-admin-controls.tsx → /admin/super-admin-controls
└─ admin/role-tool.tsx           → /admin/role-tool

PAGES DIRECTORY (pages/)
├─ Health.tsx                    → /health
├─ SettingsKeys.tsx              → /settings/keys
├─ Super/
│  ├─ index.tsx                  → /super
│  ├─ Pools.tsx                  → /super/pools
│  ├─ Workers.tsx                → /super/workers
│  ├─ Flags.tsx                  → /super/flags
│  └─ Incidents.tsx              → /super/incidents
├─ SuperAndy/
│  └─ Index.tsx                  → /super-andy, /super-andy-v2
├─ AdminRocker/
│  ├─ Index.tsx                  → /admin-rocker
│  ├─ Tools.tsx                  → /admin-rocker/tools
│  ├─ Audits.tsx                 → /admin-rocker/audits
│  ├─ Moderation.tsx             → /admin-rocker/moderation
│  └─ Budgets.tsx                → /admin-rocker/budgets
└─ UserRocker/
   ├─ Index.tsx                  → /rocker
   └─ Preferences.tsx            → /rocker/preferences
```

---

## Orphaned Files (NOT in App.tsx)

### High-Value Orphans (Probably Should Be Wired)
```
routes/admin/a11y.tsx                    A11y Admin
routes/admin/audit.tsx                   Audit Trail
routes/admin/claims.tsx                  Claims Management
routes/admin/control-room.tsx            Control Room
routes/admin/features.tsx                Features Admin
routes/admin/system.tsx                  System Health
routes/admin/tests.tsx                   Test Runner
routes/ai/activity.tsx                   AI Activity
routes/app-store/index.tsx               App Store
routes/claim/[entityId].tsx              Claim Flow
routes/compose.tsx                       Compose Post
routes/crm/index.tsx                     CRM
routes/_diag.tsx                         Diagnostics
```

### Dashboard Chaos (3 Versions!)
```
routes/dashboard.tsx                     Dashboard v1
routes/dashboard-v2.tsx                  Dashboard v2
routes/dashboard-new/index.tsx           Dashboard v3 (NEW)
```

### Farm Ops Suite (8 Files - Complete Feature Set)
```
routes/farm-ops/index.tsx                Hub
routes/farm-ops/calendar.tsx             Calendar
routes/farm-ops/directory.tsx           Directory
routes/farm-ops/inventory.tsx           Inventory
routes/farm-ops/jobs.tsx                 Jobs
routes/farm-ops/logistics.tsx           Logistics
routes/farm-ops/marketplace.tsx         Marketplace
routes/farm-ops/weather.tsx             Weather
```

### Other Orphaned Features
```
routes/insights/index.tsx                Insights Hub
routes/insights/[id].tsx                 Insight Detail
routes/live/[id].tsx                     Live Stream
routes/live/create.tsx                   Create Stream
routes/entities/[id]/activities.tsx      Entity Activities
routes/entities/[id]/connections.tsx     Entity Connections
routes/entities/[id]/insights.tsx        Entity Insights
routes/events/create.tsx                 Create Event
routes/listings/create.tsx               Create Listing
routes/messages/[id].tsx                 Message Thread
routes/profile/edit.tsx                  Edit Profile
... and 90+ more
```

---

## Dead Code (Likely Unused)

### Definitely Replaced
```
❌ routes/rocker-hub.tsx           → Replaced by pages/UserRocker/
❌ routes/super-andy.tsx           → Replaced by pages/SuperAndy/Index.tsx
❌ routes/admin-rocker.tsx         → Replaced by pages/AdminRocker/
❌ pages/Login.tsx                 → Replaced by routes/auth.tsx
```

### Probably Unused
```
⚠️  routes/dashboard.tsx           → Which version is active?
⚠️  routes/dashboard-v2.tsx        → Which version is active?
⚠️  pages/SuperAndy.tsx            → Replaced by pages/SuperAndy/Index.tsx?
⚠️  pages/NotFound.tsx             → Is this ever shown?
```

---

## The Three Surfaces We Just Built

### 1. User Rocker (Personal Hub)
```
📁 pages/UserRocker/
├─ Index.tsx           → /rocker (Hub with quick links)
└─ Preferences.tsx     → /rocker/preferences (AI settings)

Routes: 2
Access: All authenticated users
Status: ✅ Complete & Wired
```

### 2. Admin Rocker (Admin Workspace)
```
📁 pages/AdminRocker/
├─ Index.tsx           → /admin-rocker (Overview)
├─ Tools.tsx           → /admin-rocker/tools (AI tools registry)
├─ Audits.tsx          → /admin-rocker/audits (Action ledger)
├─ Moderation.tsx      → /admin-rocker/moderation (Incidents)
└─ Budgets.tsx         → /admin-rocker/budgets (Model routing)

Routes: 5
Access: Admin + Super admin
Status: ✅ Complete & Wired
```

### 3. Super Andy (AI Assistant)
```
📁 pages/SuperAndy/
├─ Index.tsx           → /super-andy (Chat + Rails)
├─ ProactiveRail.tsx   → (Component)
└─ SelfImproveLog.tsx  → (Component)

Routes: 2 (/super-andy + /super-andy-v2)
Access: All users (/super-andy), Super admin only (/super-andy-v2)
Status: ✅ Complete & Wired
```

---

## Current vs Intended Architecture

### Intended Architecture (Original Plan)
```
10 Canonical Routes in App.tsx
Everything else via ?app=overlay system
Clean, minimal routing
~20 route files max
```

### Current Reality
```
39 Routes in App.tsx (390% of target)
145+ route files (725% of target)
100+ orphaned files
Massive tech debt
```

### Cleanup Plan
```
Phase 1: Delete dead files (routes/rocker-hub.tsx, etc.)
Phase 2: Consolidate dashboards (pick one, delete others)
Phase 3: Move features to overlay system
Phase 4: Reduce App.tsx to 10 canonical routes
Result: 10 routes, ~30 files, clean architecture
```

---

**Status:** Complete site audit done. All 39 routes documented. 145+ files inventoried. Three new surfaces fully wired and operational.
