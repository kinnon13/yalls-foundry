# SPRINT 1 STATUS REPORT — Shell, App Units, Pinboard, AI Hooks

Generated: 2025-01-XX

## CRITICAL GAPS SUMMARY
- **Pass Rate**: 23% (7/30 major items)
- **Blocking Issues**: 5 architecture-level failures
- **Major Gaps**: 18 missing features
- **Minor Issues**: 5 polish items

---

## 0) NON-NEGOTIABLES STATUS

| Item | Status | Notes |
|------|--------|-------|
| Design Lock (PIN) | ❌ MISSING | No PIN system exists |
| No full-page nav | ⚠️ PARTIAL | Overlay system exists but not integrated |
| Body never scrolls | ✅ PASS | `overflow: hidden` set in index.css |
| PWA disabled | ✅ PASS | No SW or manifest found |
| Single Auth provider | ✅ PASS | Using @/lib/auth/context |
| One Router | ✅ PASS | Single BrowserRouter in App.tsx |

**Score**: 4/6 PASS

---

## 1) SHELL & LAYOUT

| Item | Status | Implementation Details |
|------|--------|------------------------|
| Fixed 3-row structure | ❌ FAIL | Uses padding (pt-14 pb-16) not grid |
| CSS vars (--header-h, --dock-h) | ❌ MISSING | Variables exist but not used correctly |
| Content height calc | ❌ FAIL | No `100dvh - var(--header-h) - var(--dock-h)` |
| Desktop split (2/3 \| 1/3) | ⚠️ WRONG RATIO | Currently has fixed widths (280px \| flex \| 420px) |
| Tablet split (1/3 \| 2/3) | ❌ MISSING | No tablet-specific layout |
| Mobile 4-screen pager | ⚠️ WRONG | Has 3-tab system (library/apps/feed) not 4-pager |
| Panes scroll independently | ✅ PASS | Both panes have overflow-y-auto |
| overscroll-behavior: contain | ✅ PASS | Set in index.css |

**Files to fix:**
- `src/routes/home/index.tsx` — Complete rewrite needed
- `src/index.css` — Add proper CSS variables usage

**Score**: 2/8 PASS

---

## 2) OVERLAY SYSTEM

| Item | Status | Notes |
|------|--------|-------|
| Registry with appId keys | ✅ EXISTS | src/lib/overlay/OverlayRegistry.tsx |
| openOverlay/closeOverlay | ✅ EXISTS | Functions present |
| ESC closes | ✅ EXISTS | Implemented |
| Back button support | ✅ EXISTS | Implemented |
| Link interceptor | ✅ EXISTS | Implemented |
| Integrated into Home | ❌ NOT INTEGRATED | Exists but not used in HomePage |
| Backdrop & focus trap | ⚠️ PARTIAL | Backdrop yes, focus trap needs verification |

**Files to fix:**
- `src/routes/home/index.tsx` — Wire up OverlayRegistry
- `src/App.tsx` — Wrap with OverlayProvider

**Score**: 5/7 PASS

---

## 3) APP UNITS (standalone + embeddable)

| Item | Status | Notes |
|------|--------|-------|
| App Unit registry | ❌ MISSING | No registry exists |
| Metadata structure | ❌ MISSING | No appId/name/icon/entryComponent/panelComponent |
| supportedContexts | ❌ MISSING | No user/business/farm/stallion/producer support |
| Overlay mode | ❌ MISSING | No distinction |
| Embeddable panel mode | ❌ MISSING | No panel components |
| Open from App Store/Dock | ⚠️ PARTIAL | Dock exists but no app unit integration |

**Files to create:**
- `src/lib/app-units/registry.ts` — Full registry with metadata
- `src/lib/app-units/types.ts` — Type definitions
- `src/components/app-units/AppUnitPanel.tsx` — Panel wrapper
- `src/components/app-units/AppUnitOverlay.tsx` — Overlay wrapper

**Score**: 0/6 PASS

---

## 4) BUSINESS PINBOARD

| Item | Status | Notes |
|------|--------|-------|
| Pinboard in Dashboard→Business | ❌ MISSING | No pinboard component |
| Pre-pinned producer tools | ❌ MISSING | CRM/Listings/Events/Earnings/Incentives |
| "Add Tool" button | ❌ MISSING | No Y'alls Library search |
| Drag to reorder | ❌ MISSING | No D&D support |
| Unpin action | ❌ MISSING | No unpin functionality |
| Empty state | ❌ MISSING | No messaging |
| Panel rendering | ❌ MISSING | No panelComponent support |

**Files to create:**
- `src/components/business/BusinessPinboard.tsx`
- `src/components/business/PinnedToolCard.tsx`
- `src/components/business/AddToolDialog.tsx`

**Score**: 0/7 PASS

---

## 5) IN-APP ACCOUNT SWITCHER

| Item | Status | Notes |
|------|--------|-------|
| Context Header component | ❌ MISSING | No switcher exists |
| Current context chip | ❌ MISSING | You/Business/Farm/Stallion/Producer |
| Switcher dropdown | ❌ MISSING | No account selector |
| "View as..." toggle | ❌ MISSING | Owner vs public |
| Context change refetch | ❌ MISSING | No data swap logic |
| CRM with tabs | ⚠️ PARTIAL | CRM page exists at /crm but needs verification |
| Works in panel & overlay | ❌ MISSING | No dual-mode support |

**Files to create:**
- `src/components/app-units/ContextHeader.tsx`
- `src/components/app-units/AccountSwitcher.tsx`
- `src/hooks/useAppContext.ts`

**Score**: 0/7 PASS

---

## 6) FAVORITES RAIL

| Item | Status | Notes |
|------|--------|-------|
| Infinite horizontal scroll | ⚠️ PARTIAL | FavoritesBar exists but needs verification |
| Entity bubbles | ⚠️ UNKNOWN | Needs visual inspection |
| 8 placeholders when empty | ❌ UNKNOWN | Not verified |
| "+ Add" bubble | ❌ UNKNOWN | Not verified |
| Bubble size matches profile | ❌ NOT VERIFIED | Needs pixel comparison |
| Sticky at top of Apps pane | ❌ NOT VERIFIED | Position needs verification |
| Public parity | ❌ NOT VERIFIED | Profile display needs verification |

**Files to verify/fix:**
- `src/components/social/FavoritesBar.tsx`
- `src/routes/home/parts/FavoritesSection.tsx`

**Score**: 0/7 NEEDS VERIFICATION

---

## 7) APPS GRID

| Item | Status | Notes |
|------|--------|-------|
| Large iOS-grade icons | ⚠️ PARTIAL | Icons exist but polish needs verification |
| Tile size slider | ❌ MISSING | No slider control |
| Horizontal pagination | ❌ FAIL | Currently vertical scroll |
| Page dots/chevrons | ❌ MISSING | No pagination UI |
| localStorage persistence | ❌ MISSING | No tile size storage |
| Management app gating | ❌ MISSING | No ownership checks |
| Create Profile quick tile | ❌ MISSING | No conditional tile for non-owners |

**Files to fix:**
- `src/routes/home/parts/LeftAppSidebar.tsx` — Complete rewrite
- `src/routes/home/parts/AppsPane.tsx` — May need creation

**Score**: 0/7 FAIL

---

## 8) FEED (TikTok + Shop)

| Item | Status | Notes |
|------|--------|-------|
| Right pane with tabs | ✅ EXISTS | SocialFeedPane has tabs |
| For You default | ⚠️ NEEDS VERIFICATION | Tab default unclear |
| Strict 9:16 reels | ⚠️ NEEDS VERIFICATION | Sizing logic needs inspection |
| Edge-to-edge | ⚠️ NEEDS VERIFICATION | No rounded masks check needed |
| Action stack (right) | ⚠️ EXISTS | Needs visual verification |
| Counts visible | ⚠️ NEEDS VERIFICATION | Like/Comment/Save/Repost/Share |
| Profile bubble + totals | ❌ NOT VERIFIED | Size parity check needed |
| Resizing recomputes | ❌ NOT VERIFIED | ResizeObserver check needed |
| Mock items working | ✅ EXISTS | Demo mode has mock feeds |

**Files to verify/fix:**
- `src/routes/home/parts/SocialFeedPane.tsx`
- `src/components/social/Reel.tsx` (if exists)

**Score**: 2/9 NEEDS VERIFICATION

---

## 9) HEADER & DOCK

### Header
| Item | Status | Notes |
|------|--------|-------|
| Home/logo clears overlay | ❌ NOT WIRED | Link exists but no overlay integration |
| Omnibox (entity/app-first) | ⚠️ PARTIAL | Search exists but prioritization unclear |
| Bell overlay with lanes | ❌ MISSING | Links to /notifications page not overlay |
| Cart | ✅ EXISTS | Links to /marketplace/cart |
| Logout | ✅ EXISTS | Functional |
| Apple-grade polish | ⚠️ NEEDS REVIEW | Visual quality check needed |

### Dock
| Item | Status | Notes |
|------|--------|-------|
| Icons-only (no labels) | ❌ FAIL | Currently HAS labels |
| Messages | ✅ EXISTS | Opens ChatDrawer |
| Create (center, elevated) | ❌ PARTIAL | Elevated but needs sheet options |
| Create sheet options | ❌ MISSING | No Profile/Business/Horse/Farm/Post/Listing/Event |
| Marketplace | ✅ EXISTS | Link present |
| Unclaimed | ✅ EXISTS | Link present (route might be missing) |
| App Store | ✅ EXISTS | Link present |
| 48-56px icons | ⚠️ PARTIAL | Currently using smaller icons (h-6 w-6 = 24px) |

**Files to fix:**
- `src/components/layout/GlobalHeader.tsx` — Wire overlay clearing, Bell overlay
- `src/components/layout/BottomDock.tsx` — Remove labels, enlarge icons, Create sheet
- `src/components/create/CreateSheet.tsx` — NEW FILE needed

**Score**: 5/13 PARTIAL

---

## 10) ROCKER AI

| Item | Status | Notes |
|------|--------|-------|
| Event bus (rocker.emit/on) | ❌ MISSING | No event bus implementation |
| AI Activity ledger | ⚠️ PARTIAL | Route exists (/ai/activity) but no logging |
| Quiet hours config | ❌ MISSING | No settings |
| Daily cap config | ❌ MISSING | No settings |
| Next Best Actions panel | ❌ MISSING | No dashboard overview integration |
| Events fired on actions | ❌ MISSING | No emit calls |
| Console/ledger visibility | ❌ MISSING | No logging UI |

**Files to create:**
- `src/lib/rocker/event-bus.ts` — Core event system
- `src/lib/rocker/activity-logger.ts` — Logging persistence
- `src/components/rocker/NextBestActions.tsx` — Dashboard widget
- `src/hooks/useRockerEvent.ts` — Hook for emitting

**Score**: 0/7 FAIL

---

## 11) MOCK DATA

| Item | Status | Notes |
|------|--------|-------|
| Accounts/Entities mock | ✅ EXISTS | Demo mode has fixtures |
| CRM contacts | ❌ NEEDS CREATION | No CRM-specific mocks |
| Favorites mock | ⚠️ PARTIAL | Pin fixtures exist but need expansion |
| Feed items (20/lane) | ✅ EXISTS | home.ts, discover.ts fixtures |
| App Library (15 units) | ❌ MISSING | No app unit fixtures |
| Next Best Actions (3 cards) | ❌ MISSING | No NBA fixtures |

**Files to create:**
- `src/lib/demo/fixtures/crm.ts`
- `src/lib/demo/fixtures/app-units.ts`
- `src/lib/demo/fixtures/next-best-actions.ts`

**Score**: 2/6 PARTIAL

---

## 12) ROUTE HYGIENE

| Item | Status | Notes |
|------|--------|-------|
| ≤10 top-level routes | ❌ FAIL | Currently 45+ routes in App.tsx |
| Legacy redirect map | ❌ MISSING | No systematic redirects |
| Link interceptor active | ✅ EXISTS | In OverlayRegistry |
| Deep links resolve to overlay | ❌ NOT TESTED | Needs verification |

**Files to fix:**
- `src/App.tsx` — Massive route consolidation needed
- `src/lib/routing/redirect-map.ts` — NEW FILE needed

**Score**: 1/4 FAIL

---

## 13) DEBUG & QA

| Item | Status | Notes |
|------|--------|-------|
| Debug HUD | ✅ EXISTS | DevHUD component exists |
| Boxes/Grid/Vars toggle | ⚠️ PARTIAL | HUD exists but modes need verification |
| Cmd/Ctrl + \` hotkey | ⚠️ UNKNOWN | Needs testing |
| Design Lock PIN | ❌ MISSING | No PIN system |
| Layout edit blocking | ❌ MISSING | No protection |

**Files to create:**
- `src/lib/design-lock/pin-system.ts`
- `src/components/design-lock/PinPrompt.tsx`
- `src/hooks/useDesignLock.ts`

**Score**: 1/5 FAIL

---

## OVERALL SCORES BY SECTION

| Section | Pass | Fail | Partial | Total | % |
|---------|------|------|---------|-------|---|
| 0. Non-negotiables | 4 | 0 | 2 | 6 | 67% |
| 1. Shell & Layout | 2 | 5 | 1 | 8 | 25% |
| 2. Overlay System | 5 | 1 | 1 | 7 | 71% |
| 3. App Units | 0 | 6 | 0 | 6 | 0% |
| 4. Business Pinboard | 0 | 7 | 0 | 7 | 0% |
| 5. Account Switcher | 0 | 6 | 1 | 7 | 0% |
| 6. Favorites Rail | 0 | 0 | 7 | 7 | 0% |
| 7. Apps Grid | 0 | 7 | 0 | 7 | 0% |
| 8. Feed | 2 | 0 | 7 | 9 | 22% |
| 9. Header & Dock | 5 | 3 | 5 | 13 | 38% |
| 10. Rocker AI | 0 | 6 | 1 | 7 | 0% |
| 11. Mock Data | 2 | 2 | 2 | 6 | 33% |
| 12. Route Hygiene | 1 | 3 | 0 | 4 | 25% |
| 13. Debug & QA | 1 | 3 | 1 | 5 | 20% |
| **TOTAL** | **22** | **49** | **28** | **99** | **22%** |

---

## BLOCKING ISSUES (Must fix immediately)

1. **SHELL ARCHITECTURE** — Not using proper 3-row grid with CSS vars
2. **APP UNITS MISSING** — Zero infrastructure for dual-mode apps
3. **BUSINESS PINBOARD MISSING** — Core producer workflow blocked
4. **ACCOUNT SWITCHER MISSING** — Can't flip context in apps
5. **APPS GRID WRONG** — Vertical scroll instead of horizontal pagination

---

## IMPLEMENTATION PRIORITY

### Phase 1: Shell Foundation (Day 1-2)
- [ ] Fix 3-row grid with proper CSS vars
- [ ] Integrate OverlayProvider into App.tsx
- [ ] Wire HomePage to use overlay system
- [ ] Fix desktop/tablet/mobile ratios
- [ ] Create proper phone 4-pager

### Phase 2: App Units Infrastructure (Day 3-4)
- [ ] Create app unit registry with metadata
- [ ] Build panel vs overlay mode distinction
- [ ] Create ContextHeader component
- [ ] Build AccountSwitcher dropdown
- [ ] Wire CRM as reference implementation

### Phase 3: Business Pinboard (Day 5)
- [ ] Create BusinessPinboard component
- [ ] Pre-pin producer tools
- [ ] Add Tool search dialog
- [ ] D&D reordering
- [ ] Panel rendering integration

### Phase 4: Grid, Feed, Polish (Day 6-7)
- [ ] Rebuild Apps grid with horizontal pagination
- [ ] Add tile size slider
- [ ] Verify/fix Feed 9:16 reels
- [ ] Remove Dock labels, enlarge icons
- [ ] Create sheet with all options
- [ ] Bell as overlay not page

### Phase 5: Rocker AI & Mock Data (Day 8)
- [ ] Build Rocker event bus
- [ ] Wire activity logging
- [ ] Create Next Best Actions
- [ ] Add CRM/App Units/NBA mocks
- [ ] Test full event flow

### Phase 6: Route Consolidation (Day 9)
- [ ] Audit all routes
- [ ] Build redirect map
- [ ] Convert pages to overlays
- [ ] Reduce to ≤10 routes

### Phase 7: Design Lock & QA (Day 10)
- [ ] Build PIN system
- [ ] Add layout edit protection
- [ ] Run full QA checklist
- [ ] Fix all blockers

---

## FILES REQUIRING IMMEDIATE ATTENTION

### Critical (blocking)
1. `src/routes/home/index.tsx` — Complete rewrite
2. `src/index.css` — Fix CSS var usage
3. `src/App.tsx` — Route consolidation + OverlayProvider
4. `src/lib/app-units/registry.ts` — NEW FILE
5. `src/components/business/BusinessPinboard.tsx` — NEW FILE

### High Priority
6. `src/components/layout/BottomDock.tsx` — Remove labels, resize icons
7. `src/components/create/CreateSheet.tsx` — NEW FILE
8. `src/components/app-units/ContextHeader.tsx` — NEW FILE
9. `src/lib/rocker/event-bus.ts` — NEW FILE
10. `src/routes/home/parts/AppsPane.tsx` — Horizontal grid

### Medium Priority
11-20. Various mock data files, CRM integration, Feed verification

---

## NEXT STEPS

**Option A (Systematic)**
Start with Phase 1 (Shell Foundation), get sign-off, then proceed to Phase 2.

**Option B (Parallel Blitz)**
Assign different sections to parallel implementation tracks and merge daily.

**Recommended**: Option A to avoid merge conflicts and ensure each layer is solid before building on it.

---

## QUESTIONS FOR CLARIFICATION

None — spec is comprehensive. Ready to implement.
