# Smoke Test Checklist

Run these checks after PR merge to verify Phase 1-4 implementation:

## 1. Architecture Validation
```bash
node scripts/validate-architecture.mjs
```
**Expected:** Prints "✅ area-discovery.json looks good"

## 2. Route Redirects
- Navigate to `/organizer/x/events`
- **Expected:** Redirected to `/workspace/x/events` (preserving state)

## 3. KPI Dashboard
- Visit `/workspace/:entityId/dashboard`
- **Expected:** See KpiTiles component with 4 tiles:
  - Revenue (may be $0 in dev)
  - Orders
  - Entries
  - Views

## 4. Theme Override Round-Trip
```javascript
await supabase.rpc('set_theme_overrides', {
  p_subject_type: 'user',
  p_subject_id: '<your-uid>',
  p_tokens: { "brand": { "primary": "#7C3AED" }}
})
```
**Expected:** Primary brand color changes immediately to purple

## 5. Config-Driven UI
- Edit `configs/area-discovery.json` (e.g., add a dummy collapsed head)
- Refresh the app
- **Expected:** Nav/scanner reflects changes without code rebuild

## 6. Work Report
- Check `work-report.json` exists at repo root
- Verify PR body includes "Work Report" section with same content

## 7. CI Validation
- Ensure `.github/workflows/show-your-work.yml` passes
- Both `validate-architecture.mjs` and `validate-work-report.mjs` should succeed
