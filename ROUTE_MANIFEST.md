# 🔒 PRODUCTION-LOCKED ROUTE MANIFEST

**Maximum Routes: 10** (enforced by CI)

Last Updated: 2025-01-22

---

## The 10 Canonical Routes

1. **/** — Landing (marketing; login/signup CTAs)
   - File: `src/pages/Index.tsx`
   - Public, no auth required
   - Shows hero, features, CTAs

2. **/dashboard** — Workspace (3-pane: Springboard | App Canvas | Social)
   - File: `src/routes/dashboard/index.tsx`
   - Authenticated users only
   - Desktop: 3 columns visible
   - Mobile: swipe between panes
   - Apps open via `?app=` query param

3. **/auth** — Login / Signup (Supabase email/password)
   - File: `src/routes/auth/index.tsx`
   - Public only (redirects if logged in)
   - Handles both login and signup modes

4. **/auth/callback** — OAuth/Email callback handler
   - File: `src/routes/auth/callback.tsx`
   - Processes Supabase auth redirects
   - Auto-redirects to dashboard on success

5. **/super** — Super Console (gated: role >= super)
   - File: `src/pages/SuperAndy/Index.tsx`
   - Admin-level tooling
   - Role-gated access

6. **/admin-rocker** — Admin Rocker Console (gated: role >= admin)
   - File: `src/pages/AdminRocker/Index.tsx`
   - AI admin interface
   - Role-gated access

7. **/privacy** — Privacy Policy (static)
   - File: `src/pages/Privacy.tsx`
   - Public, legal content

8. **/terms** — Terms of Service (static)
   - File: `src/pages/Terms.tsx`
   - Public, legal content

9. **/healthz** — Health probe (200/OK)
   - File: `src/pages/Health.tsx`
   - Monitoring endpoint

10. **\*** — LegacyRedirector → `/dashboard?app=…`
    - File: `src/routes/LegacyRedirector.tsx`
    - Catch-all for old routes
    - Maps `/messages` → `/dashboard?app=messages`
    - Maps `/orders` → `/dashboard?app=orders`
    - Unmapped routes → `/dashboard`

---

## Removed Routes

- **/embed** — Dropped to maintain 10-route budget
  - Can be re-added as modal or overlay if needed
  - File preserved at `src/routes/embed.tsx` (not routed)

---

## Overlay System (NOT Routes)

Apps open in the dashboard center canvas via `?app=` param:
- `?app=messages` — Messages
- `?app=orders` — Orders
- `?app=cart` — Shopping Cart
- `?app=yallbrary` — App Library
- `?app=overview` — Owner HQ
- `?app=profile` — Profile
- `?app=entities` — Entities
- `?app=events` — Events
- `?app=mlm` — MLM Network
- `?app=settings` — Settings
- etc.

**Registry:** `src/lib/overlay/registry.ts`

---

## CI Enforcement

```bash
# Route budget check (must pass)
node scripts/check-routes.mjs  # Expect: "Route count: 10"

# TypeScript validation
pnpm tsc --noEmit

# Build check
pnpm build
```

---

## Modification Policy

🔒 **DO NOT add new routes without explicit approval.**

If you need a new page:
1. Use the overlay system (`?app=newfeature`)
2. Add to `src/lib/overlay/registry.ts`
3. Keep route count at 10

To modify this manifest, update this file and the routes simultaneously.
