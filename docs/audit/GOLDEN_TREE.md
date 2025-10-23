# Golden Tree - Expected Project Structure

This is the **canonical reference** for where everything should be placed.

---

## Root Structure

```
project-root/
├── .github/
│   └── workflows/
│       ├── all-on-demand.yml
│       ├── tests-only.yml
│       ├── show-your-work.yml
│       └── verify-platform.yml
├── docs/
│   ├── README.md
│   ├── SITE_STRUCTURE.md
│   ├── QUICK_REFERENCE_MAP.md
│   ├── PROJECT_RULES.md
│   ├── architecture/
│   │   └── 10-SECTION-LOCKDOWN.md
│   ├── processes/
│   │   ├── BRANCHING_STRATEGY.md
│   │   └── SOLO_WORKFLOW.md
│   ├── production/
│   │   └── PRODUCTION_HARDENING.md
│   ├── runbooks/
│   │   └── feature-map.md
│   ├── testing/
│   │   └── QUICK_START.md
│   └── audit/
│       ├── MASTER_AUDIT.md          # Main audit doc
│       ├── GOLDEN_TREE.md           # This file
│       ├── TREE_SNAPSHOT.md         # Generated: actual state
│       └── INVENTORY.md             # Generated: inventory
├── scripts/
│   ├── ci-guards.mjs                # CI constraint enforcement
│   ├── check-routes.mjs             # Route budget validator
│   └── audit/
│       ├── tree.mjs                 # Tree snapshot generator
│       ├── inventory.mjs            # Inventory generator
│       └── check-tenant-guards.sh   # Tenant isolation checks
├── src/
│   ├── main.tsx                     # React entry point
│   ├── App.tsx                      # Root app component (10 routes max)
│   ├── index.css                    # Global styles + design tokens
│   ├── apps/                        # Overlay mini-apps
│   │   ├── overview/
│   │   │   ├── contract.ts          # App metadata
│   │   │   ├── Entry.tsx            # Full-screen view
│   │   │   └── Panel.tsx            # Side-panel view
│   │   ├── notifications/
│   │   │   ├── contract.ts
│   │   │   ├── Entry.tsx
│   │   │   └── Panel.tsx
│   │   ├── analytics/
│   │   │   ├── contract.ts
│   │   │   ├── Entry.tsx
│   │   │   └── Panel.tsx
│   │   └── settings/
│   │       ├── contract.ts
│   │       ├── Entry.tsx
│   │       └── Panel.tsx
│   ├── pages/                       # Standalone pages
│   │   ├── Index.tsx                # Landing page (/)
│   │   ├── Dashboard.tsx            # Dashboard host (/dashboard)
│   │   ├── Privacy.tsx              # Privacy policy
│   │   ├── Terms.tsx                # Terms of service
│   │   ├── Healthz.tsx              # Health check
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── Callback.tsx
│   │   ├── SuperAndy/
│   │   │   ├── Index.tsx            # Main Super Andy page
│   │   │   ├── ProactiveRail.tsx
│   │   │   └── SelfImproveLog.tsx
│   │   ├── UserRocker/
│   │   │   ├── Index.tsx            # User hub
│   │   │   └── Preferences.tsx
│   │   ├── AdminRocker/
│   │   │   ├── Index.tsx
│   │   │   ├── Tools.tsx
│   │   │   ├── Audits.tsx
│   │   │   ├── Moderation.tsx
│   │   │   └── Budgets.tsx
│   │   └── Super/
│   │       ├── index.tsx            # Super console
│   │       ├── Pools.tsx
│   │       ├── Workers.tsx
│   │       ├── Flags.tsx
│   │       └── Incidents.tsx
│   ├── components/
│   │   ├── navigation/
│   │   │   ├── Nav.tsx              # Main navigation
│   │   │   └── RoleGate.tsx         # Role-based access
│   │   ├── super-andy/
│   │   │   └── SuperAndyChat.tsx
│   │   └── ui/                      # shadcn components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ...
│   ├── layouts/
│   │   └── AppLayout.tsx            # Main app layout
│   ├── lib/
│   │   ├── overlay/
│   │   │   ├── types.ts             # Type definitions
│   │   │   ├── registry.ts          # App registry
│   │   │   ├── deeplink.ts          # Route → app mapping
│   │   │   └── RouteToOverlayBridge.tsx
│   │   ├── sentry.ts                # Error tracking
│   │   └── utils.ts                 # Shared utilities
│   ├── router/
│   │   ├── registry.ts              # Route registration
│   │   └── createAppRouter.tsx      # Router factory
│   ├── hooks/                       # Custom React hooks
│   └── integrations/
│       └── supabase/
│           ├── client.ts            # Supabase client (auto-generated)
│           └── types.ts             # DB types (auto-generated)
├── supabase/
│   ├── config.toml                  # Supabase config (auto-generated)
│   └── migrations/
│       └── *.sql                    # Database migrations
├── tests/
│   ├── setup.ts
│   └── e2e/
│       └── super.e2e.spec.ts
├── public/
│   └── ...                          # Static assets
├── structure.lock.json              # Folder structure manifest
├── package.json                     # Dependencies (read-only)
├── tsconfig.json                    # TypeScript config
├── vite.config.ts                   # Vite config
├── vitest.config.ts                 # Vitest config
├── tailwind.config.ts               # Tailwind config
└── README.md                        # Project README
```

---

## Key Principles

### 1. Route Budget: 10 Routes Max in App.tsx

```tsx
// EXACTLY these 10 routes in <Routes> block:
<Route path="/" element={<Index />} />
<Route path="/auth" element={<Login />} />
<Route path="/auth/callback" element={<Callback />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />
<Route path="/healthz" element={<Healthz />} />
<Route path="/super-andy" element={<SuperAndy />} />
<Route path="/settings" element={<SettingsPage />} />
<Route path="/*" element={<LegacyRedirector />} />
```

### 2. Apps Go in `src/apps/`

Every overlay app lives under `src/apps/{app-id}/`:

- ✅ **Required:** `contract.ts` (defines id, title, routes, role)
- ✅ **Required:** `Entry.tsx` (full-screen view)
- ⚠️ **Optional:** `Panel.tsx` (side-panel view)
- ⚠️ **Optional:** `README.md` (app docs)

### 3. Pages Go in `src/pages/`

Standalone pages that are NOT overlay apps:

- `Index.tsx` - Landing page
- `Dashboard.tsx` - Dashboard host (contains OverlayHost)
- `Privacy.tsx` / `Terms.tsx` / `Healthz.tsx` - Static pages
- `Auth/` - Authentication flows
- `SuperAndy/` - Super Andy standalone
- `UserRocker/` - User workspace
- `AdminRocker/` - Admin workspace
- `Super/` - Super console

### 4. Components Go in `src/components/`

Reusable UI components:

- `navigation/` - Nav, RoleGate
- `super-andy/` - Super Andy specific
- `ui/` - shadcn/ui components

### 5. Docs Go in `docs/`

All documentation:

- Top-level: `README.md`, `SITE_STRUCTURE.md`, etc.
- `architecture/` - System design
- `processes/` - Workflows
- `runbooks/` - Operations
- `testing/` - Test guides
- `audit/` - Audit tools & reports

### 6. Scripts Go in `scripts/`

Build/CI scripts:

- `ci-guards.mjs` - CI enforcement
- `check-routes.mjs` - Route budget check
- `audit/` - Audit generators

---

## Anti-Patterns (DO NOT DO)

❌ **NO** routes in `src/apps/` - use contracts instead  
❌ **NO** overlay apps in `src/pages/` - use `src/apps/`  
❌ **NO** `OverlayHost` in `App.tsx` - only in `/dashboard`  
❌ **NO** more than 10 routes in App.tsx  
❌ **NO** direct route definitions in overlay apps  

---

## Validation

To verify your project matches this golden tree:

```bash
# Generate actual tree
node scripts/audit/tree.mjs

# Generate inventory
node scripts/audit/inventory.mjs

# Compare against this file manually
diff docs/audit/GOLDEN_TREE.md docs/audit/TREE_SNAPSHOT.md
```

---

## Updates

When adding new features:

1. **If it's a mini-app:** → `src/apps/{app-id}/`
2. **If it's a standalone page:** → `src/pages/{PageName}/`
3. **If it's a reusable component:** → `src/components/{category}/`
4. **If it needs docs:** → `docs/{category}/`
5. **Update this file** if structure changes

---

**Last Updated:** Manual - update when architecture changes
