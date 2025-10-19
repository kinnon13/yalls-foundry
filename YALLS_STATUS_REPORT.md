# Y'alls App - Status Report & Gap Analysis

Generated: 2025-10-19  
Spec Version: Single Source of Truth (Home + Feed + Dashboard + Overlays + Data + QA)

---

## 1. ROUTE & OVERLAY MAP

### ✅ Core Routes Found (11 found vs ≤10 required)
1. `/` → Home shell ✅
2. `/discover` → Discover ✅
3. `/dashboard` → Dashboard (draggable grid style) ⚠️ **Different architecture**
4. `/messages` → Messages ✅
5. `/profile/:id` → Public profile ✅
6. `/entities` → Browse & claim ✅
7. `/events` → Events index/create ✅
8. `/listings` → Listings (redirects to marketplace) ✅
9. `/cart` → Cart (at `/marketplace/cart`) ⚠️
10. `/orders` → Orders list ✅
11. `/orders/:id` → Order detail ✅

**STATUS**: ⚠️ OVER LIMIT (45+ routes found)

### ❌ EXCESS ROUTES FOUND (35+ beyond spec)
- `/login`, `/search`, `/profile`, `/stallions`, `/stallions/:id`
- `/admin/*` (control-room, features, routes, components, a11y, audit, tests, stubs)
- `/notifications`, `/settings/*`
- `/marketplace/:id`, `/listings/*` (new, edit)
- `/events/*` (13 nested routes: classes, entries, draw, results, payouts, stalls, qr-checkin, etc.)
- `/feed`, `/social`, `/crm`, `/me`, `/health`
- `/farm/*` (calendar, dashboard, boarder, tasks, health)
- `/incentives/dashboard`, `/entrant/*` (my-entries, my-draws, my-results)
- `/workspace` (dashboard alias)
- Preview system routes (`/preview/*`)

### ❌ OVERLAY SYSTEM
**STATUS**: **NOT IMPLEMENTED** as specified

Expected: `?app=<key>` query param system with overlay registry  
Found: Traditional React Router full-page navigation

**Missing Components:**
- No overlay registry found
- No `?app=` param handling for in-shell overlays
- No ESC/X close behavior
- No internal link interception to prevent full-page nav
- Links like `/marketplace` trigger full navigation instead of overlay

---

## 2. LAYERING, SIZING, SAFE AREAS

### ⚠️ Fixed Layout Implementation

**Home Shell** (`src/routes/home/index.tsx`):
- ✅ Uses `100dvh`: `h-[calc(100dvh-112px)]`
- ❌ **NOT** using CSS variables `--header-h` and `--dock-h`
- ❌ **NOT** using 3-row grid (row1 header, row2 content, row3 dock)
- ✅ Header fixed at z-40
- ✅ Dock includes safe-area: `pb-[max(0px,env(safe-area-inset-bottom))]`
- ⚠️ Body scroll: Found `100vh` and `h-screen` in **64 files** (104 occurrences)

**Dashboard** (`src/routes/dashboard/index.tsx`):
- ⚠️ Different architecture: uses `h-dvh` container with draggable feed panel
- ❌ NOT following 3-row grid spec
- ✅ Uses `h-[calc(100dvh-var(--header-h,64px))]`
- ❌ Feed is draggable/resizable (not in spec)

### ❌ CRITICAL ISSUES:
1. Body scroll leaks: 64 files with `h-screen` or `100vh` mixtures
2. Missing CSS variables `--header-h`, `--dock-h` in `index.css`
3. No consistent 3-row grid pattern across shells
4. Pane sizing not matching spec:
   - **Desktop**: Found 2/3 left + 1/3 right ❌ (Spec: 2/3 apps | 1/3 feed)
   - **Tablet**: Not implemented
   - **Phone**: Uses tab switcher, NOT 4-screen horizontal pager

---

## 3. HEADER (z-40, fixed)

**Current Implementation** (`src/components/layout/GlobalHeader.tsx`):

✅ Fixed position with z-40  
✅ Home/Logo link  
✅ Search (Omnibox)  
✅ Notification bell  
✅ Cart icon  
✅ Logout button  
⚠️ Admin shield icon (extra, not in spec)  
❌ Bell doesn't open overlay panel as specified  
❌ Search doesn't prioritize internal entities/apps  
❌ No "Open external" webview option

**GAP**: Bell should open lanes overlay; search needs entity-first logic

---

## 4. BOTTOM DOCK

**Current Implementation** (`src/components/layout/BottomDock.tsx`):

✅ Icons-only, no labels  
✅ Safe-area padding: `pb-[max(0px,env(safe-area-inset-bottom))]`  
✅ Messages (opens ChatDrawer)  
✅ Create (center elevated)  
✅ Marketplace  
✅ Unclaimed  
✅ App Store  

⚠️ **Issues:**
- Icon sizes are `h-12 w-12` (48px) vs spec 48–56px (within range but inconsistent)
- Create button uses `h-14 w-14` (56px) ✅
- No z-index explicitly set (relies on Tailwind fixed)
- ❌ Create sheet doesn't list all options (Profile/Business/Horse/Farm/Post/Listing/Event)

---

## 5. HOME — LEFT PANE (Apps Catalog + Favorites)

### 5.1 Favorites Rail

**Current Implementation** (`src/routes/home/parts/FavoritesSection.tsx`):

✅ Queries `user_pins` table  
✅ Shows pinned entities  
✅ Uses `FavoritesBar` component  
⚠️ **Missing:**
- ❌ NOT infinite horizontal scroll
- ❌ NO empty state with 8 placeholders
- ❌ NO "+ Add" bubble
- ❌ Public/private toggle NOT visible
- ❌ Bubble size parity with Profile bubble NOT enforced

**GAP**: Favorites rail needs placeholders, +Add flow, infinite scroll

### 5.2 Apps Grid

**Current Implementation** (`src/routes/home/parts/LeftAppSidebar.tsx`):

❌ **NOT** horizontally paged  
❌ Apps displayed in vertical scroll groups (Commerce, Money, Ops, Growth, Creator, System)  
❌ NO tile size slider  
❌ NO page dots/chevrons  
❌ Management apps NOT gated by ownership  
❌ NO "Create Profile" quick tile when user owns nothing  

**CRITICAL GAP**: Apps grid architecture completely different from spec

---

## 6. HOME — RIGHT PANE (TikTok Feed)

### 6.1 Top Summary

**Current Implementation** (`src/routes/home/parts/SocialProfileHeader.tsx`):

✅ Profile bubble with username/handle  
✅ Aggregate totals (Following, Followers, Likes)  
⚠️ Bubble size: 64px (w-16 h-16)  
❌ Tapping bubble does NOT open public profile overlay  
❌ Bubble size parity with Favorites NOT verified

### 6.2 Tabs

**Current Implementation** (`src/routes/home/parts/SocialFeedPane.tsx`):

✅ Following / For You / Shop tabs  
✅ Sticky tabs  
✅ Swipe to switch (touch/drag implemented)  
⚠️ Default tab: `following` (spec says For You)  
⚠️ Tab array: `['following', 'for-you', 'shop', 'profile']` — **PROFILE tab not in spec**
❌ Keyboard ←/→ NOT implemented  
⚠️ URL persistence: uses `?feed=` param ✅ but also `?entity=`

### 6.3 Reels

**Current Implementation** (`src/components/reels/Reel.tsx`):

✅ 9:16 aspect ratio logic  
✅ Edge-to-edge, no rounding (`borderRadius: 0`)  
✅ Action stack (Like, Comment, Save, Repost, Share)  
✅ Double-tap like with heart burst  
⚠️ **Sizing Logic** (`SocialFeedPane.tsx` lines 107-136):
  - ✅ Uses `ResizeObserver` to measure pane height
  - ⚠️ Calculates available height minus header
  - ❌ **BUG**: Recent changes may have broken strict 9:16 enforcement

❌ **Missing Features:**
- Video autoplay/mute/pause (only images shown in placeholder data)
- Keyboard ↑/↓ navigation
- Virtualization (render ±1 only)
- Preload prev/next
- Lane blending (placeholder data is static, no server-driven mixing)
- Listing carousel, RSVP buttons, "Add to Cart" 1-tap
- Type-specific features (Listing Reel, Event Reel)

### 6.4 Public Calendar Widget

❌ **NOT FOUND** — No public calendar widget in Home right pane

---

## 7. PHONE MODE — 4-Screen Pager

**Current Implementation** (`src/routes/home/index.tsx` lines 106-179):

❌ **NOT A PAGER** — Uses vertical tab switcher:
- Three tabs: Library | Apps | Feed (not 4 screens)
- No Shop screen
- No Profile screen
- Tab switching is instant, not horizontal swipe pager
- Content replaces entirely, not side-by-side slides

**CRITICAL GAP**: Phone mode needs 4-screen horizontal pager

---

## 8. OVERLAY REGISTRY & INTERCEPTS

❌ **NOT IMPLEMENTED**

**Missing:**
- No overlay registry
- No `?app=<key>` handling
- No ESC/X close behavior
- No internal link interception
- All navigation uses React Router full-page transitions

**CRITICAL**: This is a foundational architecture gap

---

## 9. DASHBOARD (Single Management Surface)

**Current Implementation** (`src/routes/dashboard/index.tsx`):

❌ **COMPLETELY DIFFERENT ARCHITECTURE**

Found: Draggable apps grid + draggable/resizable feed panel  
Spec: Single left rail with modules (Overview, Business, Stallions, Incentives, Farm Ops, Events, Orders, Earnings, Messages, Settings)

**Separate Module Files Found:**
- `src/routes/dashboard/overview/index.tsx` (stub)
- `src/routes/dashboard/business.tsx` (exists)
- `src/routes/dashboard/settings.tsx` (exists)
- Others not found as single surface

**GAP**: Dashboard needs complete rebuild to match spec

---

## 10. DATA / SECURITY / PAYMENTS / NOTIFS

### ✅ Tables Found:
- `user_pins` (favorites) ✅
- `entities` ✅
- `profiles` ✅
- `favorites` ✅
- `user_roles` ✅
- `incentive_programs` ✅

### ⚠️ RLS Policies:
- Cannot verify without Supabase dashboard access
- Spec requires deny-by-default, owner/member enforcement

### ❌ Notifications:
- Lanes system NOT verified
- Quiet hours enforcement NOT found
- Bell panel mark-all NOT implemented as overlay

### ⚠️ Payments:
- Feature flags NOT found in codebase
- `features.payments_real=false` NOT in env
- `VITE_ENABLE_STRIPE` NOT set
- Mock checkout NOT verified

### ✅ Telemetry:
- `usePageTelemetry` hook found ✅
- Event emission patterns NOT fully verified against spec list

---

## 11. ACCESSIBILITY & MOTION

### ⚠️ Partial Implementation:
- ✅ Tabs use proper roles in some components
- ⚠️ Icon buttons have aria-labels (spot-checked)
- ❌ Reduced motion: NOT systematically implemented
- ❌ Keyboard navigation: Partial (no ↑/↓ reel, ←/→ lane, ESC overlay)

---

## 12. PERFORMANCE BUDGETS

### ❌ Major Gaps:
- Virtualization: NOT found in `SocialFeedPane.tsx` (renders all 20 items)
- Preloading: NOT implemented
- IntersectionObserver: NOT used for reel activation
- No layout thrash prevention noted

---

## 13. TELEMETRY (Rocker Events)

**Events Found:**
- `usePageTelemetry` emits page views ✅
- Individual action events NOT verified

**Missing:** Full event map against spec list

---

## 14-19. OTHER PAGES

### ✅ Discover: `/discover` route exists
### ✅ Profile: `/profile/:id` exists
### ✅ Entities: `/entities` exists
### ✅ Events & Listings: Routes exist with extensive sub-routes
### ✅ Cart: `/cart` exists
### ✅ Orders: `/orders` and `/orders/:id` exist

**Status**: Routes exist but behaviors NOT verified against overlays spec

---

## 20. DEBUG & DESIGN-LOCK

### ⚠️ Debug HUD:
- `DevHUD` component found in `src/components/dev/DevHUD.tsx` ✅
- Boxes/Grid/Vars modes NOT verified
- Hotkey (`Cmd/Ctrl + \``) NOT confirmed

### ❌ Design Lock:
- **NOT FOUND** — No PIN prompt, no lock state, no pane resizing blocks

---

## 21. CODEBASE AUDIT

### ❌ PWA Remnants:
- `PreviewGuard` unregisters service workers ✅
- No `manifest.json` in public/ ✅
- No active service worker registration ✅

### ❌ Duplicate Providers:
- Single `TooltipProvider` in UI component ✅
- Single `AuthProvider` in `@/lib/auth/context` ✅
- No duplicates found ✅

### ❌ Body Scroll Leaks:
- **64 files** with `h-screen` or `100vh` mixtures ❌
- `body { overflow: hidden; }` NOT set in `index.css` ❌

### ✅ No Stray Glyphs:
- No robot/stray glyph behind Rocker found ✅

### ❌ Rounded Masks:
- Fixed in `Reel.tsx` with `borderRadius: 0` ✅
- BUT sizing issues remain ⚠️

---

## 22. ACCEPTANCE CHECKLIST

| # | Requirement | Status |
|---|-------------|--------|
| 1 | No body scroll; panes scroll independently | ❌ FAIL |
| 2 | Header & Dock always visible; no overlap | ⚠️ PARTIAL |
| 3 | Favorites rail sticky & infinite; placeholders; +Add | ❌ FAIL |
| 4 | Profile bubble size matches favorites | ⚠️ UNKNOWN |
| 5 | Tabs sticky; click & swipe; For You default | ⚠️ PARTIAL (wrong default) |
| 6 | Reels strict 9:16; edge-to-edge; action stack | ⚠️ PARTIAL |
| 7 | Desktop 2/3\|1/3; Tablet 1/3\|2/3; Phone 4-pager | ❌ FAIL |
| 8 | Apps grid horizontal paging; tile size persists | ❌ FAIL |
| 9 | Overlay apps open via ?app= and close on ESC | ❌ NOT IMPLEMENTED |
| 10 | Dock icons-only, polished | ✅ PASS |
| 11 | Design Lock with PIN | ❌ NOT IMPLEMENTED |
| 12 | Debug HUD works | ⚠️ EXISTS (not verified) |
| 13 | PWA truly off | ✅ PASS |
| 14 | RLS enforced | ⚠️ CANNOT VERIFY |
| 15 | Performance: virtualization, no jank | ❌ FAIL |

**PASS RATE: 2/15 (13%)**

---

## CRITICAL GAPS SUMMARY

### 🔴 ARCHITECTURE-LEVEL (Must Fix First):
1. **Overlay System**: NOT IMPLEMENTED — foundational gap affecting entire app
2. **3-Row Grid Layout**: NOT IMPLEMENTED — affects all shells
3. **Dashboard Architecture**: Completely different from spec
4. **Phone Mode**: Tab switcher instead of 4-screen pager
5. **Apps Grid**: Vertical scroll instead of horizontal paging

### 🟡 MAJOR FEATURES (Next Priority):
6. **Favorites Rail**: Missing placeholders, +Add, infinite scroll, public parity
7. **Reel Virtualization**: Rendering all items, not ±1
8. **Design Lock**: NOT IMPLEMENTED
9. **Lane Blending**: Static data, no server-driven mixing
10. **Body Scroll Leaks**: 64 files need cleanup

### 🟢 POLISH & REFINEMENT:
11. Default tab should be "For You" not "Following"
12. Keyboard navigation missing (↑/↓ reel, ←/→ lane, ESC)
13. Public calendar widget missing
14. Notification bell overlay missing
15. Create sheet incomplete options

---

## RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Foundation (Week 1-2)
1. Implement overlay system (?app= registry, ESC close, intercepts)
2. Refactor to 3-row grid (Header/Content/Dock with CSS vars)
3. Fix body scroll leaks (set overflow:hidden, audit 64 files)

### Phase 2: Layouts (Week 3-4)
4. Rebuild Dashboard as single left rail
5. Implement 4-screen phone pager
6. Fix apps grid (horizontal paging, tile size)
7. Add Favorites rail placeholders + Add flow

### Phase 3: Features (Week 5-6)
8. Reel virtualization (±1 rendering)
9. Lane blending logic
10. Design Lock with PIN
11. Keyboard navigation
12. Public calendar widget

### Phase 4: Polish (Week 7-8)
13. Complete Create sheet options
14. Bell notification overlay
15. Full accessibility audit
16. Performance testing & optimization

---

## FILES REQUIRING IMMEDIATE ATTENTION

### Critical:
1. `src/routes/home/index.tsx` — Rebuild with overlay support + 3-row grid
2. `src/index.css` — Add CSS vars, fix body scroll
3. `src/App.tsx` — Add overlay registry, reduce route count
4. `src/routes/dashboard/index.tsx` — Complete rebuild
5. `src/components/layout/BottomDock.tsx` — Complete Create sheet

### Major:
6. `src/routes/home/parts/SocialFeedPane.tsx` — Add virtualization
7. `src/routes/home/parts/LeftAppSidebar.tsx` — Rebuild as paged grid
8. `src/routes/home/parts/FavoritesSection.tsx` — Add placeholders, infinite scroll

---

**END OF REPORT**
