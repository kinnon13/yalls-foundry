# Yallbrary - App Store Pinning

**Role**: Widget marketplace for pinning apps to user rocker dashboard with drag-drop UI and ?app= deep linking.

## Features
- Dynamic app loading via ?app= query param
- Drag-and-drop widget customization (responsive touch for mobile)
- App registry with deploy-to-rocker workflow
- Remix workflows for custom app combinations

## Structure
- `src/` - React components, services, hooks
- `supabase/functions/yallbrary/` - Edge function for store API
- `scripts/` - Seed data, build utilities
- `cypress/e2e/` - UI tests for pinning
- `k6/` - Load testing (1K concurrent pins)
- `ops/` - Deploy and backup scripts
- `sec/` - OPA policies for access control

## Quick Start
```bash
npm run dev
# Visit http://localhost:5173?app=yallbrary
npx cypress run --spec cypress/e2e/pin.spec.cy
k6 run k6/load-pin.js
```

## API Contract
- **ID**: `yallbrary`
- **Role**: `user` (all authenticated users)
- **Routes**: `/apps`, `/apps/:appId`, `/pin`
