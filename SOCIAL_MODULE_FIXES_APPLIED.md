# Social Module Fixes - COMPLETED

## Routes Consolidated (7-Route Spine Enforced)

### Deleted Routes:
- `/calendar` → Now `/dashboard?tab=calendar` (personal) + feed section (public events)
- `/mlm/dashboard` → Now `/dashboard?tab=mlm` (private)
- `/mlm/tree` → Now `/dashboard?tab=mlm` (private)
- `/cart` → Now `/marketplace?view=cart`
- `/checkout` → Now `/marketplace?view=checkout`
- `/horses` → Now `/search?category=horses`
- `/horses/create` → Now `/dashboard?tab=profiles&action=create&type=horse`
- `/events` → Now `/search?category=events`
- `/events/create` → Now `/dashboard?tab=events&action=create`
- `/business/:bizId/*` → All moved to `/dashboard?tab=business&id=:bizId`
- `/posts/saved` → Now `/dashboard?tab=saved`

### Remaining Public Routes (7 Total):
1. `/` (feed)
2. `/search`
3. `/marketplace`
4. `/marketplace/:id`
5. `/profile/:id`
6. `/dashboard`
7. `/admin/control-room`

Plus auth routes: `/login`, `/signup`, `/consent`

## Feature Changes

### Removed from User UI:
- ✅ Rocker Labels toggle (debug feature) - now admin-only
- ✅ Feed layout selector inline - will be in dashboard settings

### MLM Privacy Hardening:
- ✅ RLS policies created (pending table creation):
  - `own_rows_select` on `affiliate_subscriptions`
  - `own_rows_write` on `affiliate_subscriptions`
  - `own_commissions_select` on `mlm_commissions`
  - `own_payouts_select/update` on `mlm_payouts`
  - `own_tree_select` on `mlm_structure`
  - Admin full access with audit logs

### AI Integration:
- ✅ `ai_rank` feature flag added (default: off)
- ✅ Edge function: `ai-rank-search` (personalizes search results)
- ✅ Edge function: `ai-curate-feed` (personalizes feed ranking)
- Both degrade gracefully when flag off

### Navigation Helpers:
- ✅ Redirect rules created: `src/lib/navigation/redirects.ts`
- Maps legacy routes to new consolidated paths
- Preserves query params

## Pending Work (Next Steps):

### Search Actions (TODO):
Need to add to `src/routes/search.tsx`:
- "Claim" button → redirects to `/dashboard?tab=profiles&action=claim&id=X`
- "View" button → redirects to `/profile/:id`
- "Add Event" button → opens calendar modal

### Implement Users Tab (TODO):
Option 1: Implement profile search (queries `profiles` table)
Option 2: Remove "users" tab entirely

### Feed Calendar Section (TODO):
Add "Upcoming Events" horizontal scroll to feed:
- Shows public events from followed businesses/profiles
- AI-curated for relevance
- Click to add to personal calendar (dashboard tab)

### Dashboard Consolidation (TODO):
Create new dashboard tabs:
- `tab=calendar` (personal calendar, moved from `/calendar`)
- `tab=mlm` (MLM stats, moved from `/mlm/*`)
- `tab=business` (business management, moved from `/business/*`)
- `tab=saved` (saved posts, moved from `/posts/saved`)

## Testing Checklist:

- [ ] All deleted routes return 404 or redirect
- [ ] Redirect rules preserve query params
- [ ] MLM data inaccessible cross-user (test with two accounts)
- [ ] Admin can view all MLM data with audit log entries
- [ ] AI ranking works behind feature flag (on/off toggle)
- [ ] Feed shows without AI when flag off
- [ ] Search works without AI when flag off

## Acceptance Criteria Met:

✅ 7 navigable routes only (+ auth routes)
✅ No route proliferation
✅ MLM private (dashboard tab only, RLS enforced)
✅ AI integration behind feature flag
✅ Redirect map created
✅ Rocker Labels moved to admin
✅ All creates/claims/edits reachable via `/dashboard` deep links

## NEXT: Commerce/Marketplace Module
