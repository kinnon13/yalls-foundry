# Smoke Test Checklist

Run these checks after PR merge to verify Phase 1-4 implementation:

## 1. Architecture Validation
```bash
node scripts/validate-architecture.mjs
```
**Expected:** Prints "✅ area-discovery.json looks good"

## 2. DB Object Validation
```bash
psql "$DATABASE_URL" -f scripts/validate-db.sql
```
**Expected:** All tables, functions, and RLS status return `ok = t`

## 3. Route Redirects
- Navigate to `/organizer/x/events`
- **Expected:** Redirected to `/workspace/x/events` (preserving state)

## 4. KPI Dashboard
- Visit `/workspace/:entityId/dashboard`
- **Expected:** See KpiTiles component with 4 tiles:
  - Revenue (may be $0 in dev)
  - Orders
  - Entries
  - Views

## 5. Theme Override Round-Trip (User)
```javascript
await supabase.rpc('set_theme_overrides', {
  p_subject_type: 'user',
  p_subject_id: (await supabase.auth.getUser()).data.user.id,
  p_tokens: { brand: { primary: '#7C3AED' } }
});
```
**Expected:** UI primary color changes to purple instantly

## 6. Theme Override (Workspace)
```javascript
await supabase.rpc('set_theme_overrides', {
  p_subject_type: 'entity',
  p_subject_id: '<ENTITY_ID>',
  p_tokens: { surface: { bg: '#0b0b0b' } }
});
```
**Expected:** In workspace routes, background becomes darker

## 7. Rocker Suggest/Accept
```javascript
// Get recommendations
await supabase.rpc('recommend_workspace_modules', { 
  p_entity_id: '<ENTITY_ID>' 
});
// Expected: JSON array of {module, reason, expected_lift}

// Accept a recommendation
await supabase.rpc('accept_module_recommendation', { 
  p_entity_id: '<ENTITY_ID>', 
  p_module: 'workspace_growth' 
});
// Expected: entitlement_overrides enabled=true and action logged in ai_action_ledger
```

## 8. KPI Tiles Data
```javascript
await supabase.rpc('get_workspace_kpis', { 
  p_entity_id: '<ENTITY_ID>', 
  p_horizon: '7d' 
});
```
**Expected:** JSON with `revenue_cents`, `orders`, `entries`, `views` (numbers)

## 9. Config-Driven UI
- Edit `configs/area-discovery.json` (e.g., add a dummy collapsed head)
- Refresh the app
- **Expected:** Nav/scanner reflects changes without code rebuild

## 10. Work Report
- Check `work-report.json` exists at repo root
- Verify PR body includes "Work Report" section with same content

## 11. CI Validation
- Ensure `.github/workflows/show-your-work.yml` passes
- All validation scripts succeed: `validate-architecture.mjs`, `validate-work-report.mjs`, `validate-db.sql`

## 12. System Health (Admin Panel)
- Navigate to `/admin/system`
- **Expected:** See DB health check results, recent AI actions, and system status
