# 🗺️ QUICK REFERENCE - WHERE IT ALL GOES

## The Rule

**If it's in this list → Direct route in App.tsx**
**If it's NOT in this list → Overlay system (`?app=key`)**

---

## ✅ DIRECT ROUTES IN APP.TSX (31 Total)

### Core App Routes (16)
```
/                        Home shell
/discover                Discover surface
/dashboard               Management hub
/messages                Messages (also overlay)
/profile/:id             Profile view
/entities                Entities browse
/events                  Events index
/events/:id              Event detail
/listings                Listings index
/listings/:id            Listing detail
/cart                    Cart checkout
/orders                  Orders list
/orders/:id              Order detail
/auth                    Authentication
/onboarding/*            Onboarding flow
/health                  Health check
```

### User Rocker (2)
```
/rocker                  Personal hub
/rocker/preferences      AI preferences
```

### Super Andy (2)
```
/super-andy              AI assistant
/super-andy-v2           AI assistant (admin)
```

### Admin Rocker (5)
```
/admin-rocker            Admin workspace
/admin-rocker/tools      Tools registry
/admin-rocker/audits     Action ledger
/admin-rocker/moderation Incidents
/admin-rocker/budgets    Model routing
```

### Super Console (5)
```
/super                   System overview
/super/pools             Worker pools
/super/workers           Worker heartbeats
/super/flags             Control flags
/super/incidents         Incident management
```

### Special Admin Routes (5)
```
/admin                   Admin dashboard
/admin/guardrails        Guardrails
/admin/approvals         Approvals
/admin/voice-settings    Voice config
/admin/super-admin-controls Super controls
/admin/role-tool         Role tool
/settings/keys           API keys
```

---

## 🔄 OVERLAY SYSTEM (23 Keys)

Access via `/?app=key` from Home shell:

```
/?app=messages           Messages (also /messages)
/?app=marketplace        Marketplace
/?app=app-store          Y'alls Library
/?app=crm                CRM
/?app=profile            Profile editor
/?app=entities           Entities browser
/?app=events             Events manager
/?app=listings           Listings creator
/?app=business           Business dashboard
/?app=producer           Producer tools
/?app=incentives         Incentives
/?app=calendar           Calendar
/?app=activity           AI Activity
/?app=analytics          Analytics
/?app=favorites          Favorites
/?app=yall-library       Library
/?app=cart               Cart (also /cart)
/?app=orders             Orders (also /orders)
/?app=notifications      Notifications
/?app=settings           Settings
/?app=overview           Owner HQ
/?app=earnings           Earnings
/?app=farm-ops           Farm Operations
/?app=mlm                Affiliate Network
```

---

## 📋 DASHBOARD TABS

Access via `/dashboard?tab=x&view=y`:

```
/dashboard?tab=ai              AI Management
/dashboard?tab=calendar        Calendar
/dashboard?tab=earnings        Earnings
/dashboard?tab=overview        Overview
/dashboard?tab=business        Business
/dashboard?tab=settings        Settings
/dashboard?tab=approvals       Approvals
/dashboard?tab=notifications   Notifications
/dashboard?tab=farm            Farm Ops
/dashboard?tab=admin           Admin Panel
/dashboard?tab=mlm             MLM Network
```

---

## 🗑️ DELETE THESE FILES

```bash
# Replaced files
rm src/routes/rocker-hub.tsx
rm src/routes/super-andy.tsx
rm src/routes/admin-rocker.tsx
rm src/pages/Login.tsx
rm src/pages/SuperAndy.tsx

# Dashboard duplicates (keep ONE version)
rm src/routes/dashboard-v2.tsx OR dashboard.tsx OR dashboard-new/

# Dashboard submodule duplicates
rm src/routes/dashboard/approvals/index.tsx
rm src/routes/dashboard/earnings/index.tsx
rm src/routes/dashboard/orders/index.tsx
rm src/routes/dashboard/overview/index.tsx

# Orphaned files
rm src/routes/claim/[entityId].tsx
rm src/routes/_diag.tsx (optional - debugging tool)
```

---

## 🎯 SIMPLE DECISION TREE

### Is it one of the 31 direct routes above?
→ YES: Keep in App.tsx
→ NO: Move to overlay system or delete

### Is it in the overlay registry (23 keys)?
→ YES: Access via `/?app=key`
→ NO: Check if it should be dashboard tab

### Is it an admin/super feature?
→ YES: Check special admin routes list
→ NO: Probably overlay or delete

### Is it a duplicate?
→ YES: Delete it
→ NO: Keep as overlay or component

---

## 📊 QUICK STATS

```
Current State:
- 39 routes in App.tsx
- 145 route files
- 100+ orphaned files

Target State:
- 31 routes in App.tsx
- ~60 active files
- 0 orphaned files

Reduction:
- 21% fewer routes
- 58% fewer files
- 100% less bloat
```

---

## 💡 GOLDEN RULES

1. **10 Canonical Routes** = Always direct routes (/, /discover, /dashboard, etc.)
2. **Rocker/Andy/Console** = Always direct routes (special workspaces)
3. **Admin Special Cases** = Direct routes (guardrails, approvals, etc.)
4. **Everything Else** = Overlay system (`?app=key`)
5. **Dashboard Features** = Tabs (`/dashboard?tab=x`)
6. **Entity/Event/Listing Details** = Direct routes with :id param
7. **Creation Flows** = Overlays or query params (`?action=create`)
8. **Admin Panels** = Components, not routes
9. **Duplicates** = Delete
10. **Orphans** = Delete or integrate

---

**Use this as your lookup table when deciding what to do with any route file.**
