# Yallmart - Amazon-Style Shopping

**Role**: One-tap shopping embedded in social feeds with cart management and Stripe/Venmo payments.

## Features
- Quick buy from social posts (one-tap add to cart)
- Shopping cart with quantity management
- Stripe/Venmo checkout integration
- Inventory sync with business products
- Order tracking and history

## Structure
- `src/` - React components, services, hooks
- `supabase/functions/yallmart/` - Edge function for cart/checkout API
- `libs/` - Inventory sync utilities
- `scripts/` - Webhook handlers for Stripe events
- `cypress/e2e/` - Cart and checkout tests
- `k6/` - Load testing (1K concurrent purchases)
- `ops/` - Deploy and scale scripts
- `sec/` - Payment security policies

## Quick Start
```bash
npm run dev
# Visit http://localhost:5173/cart
npx cypress run --spec cypress/e2e/cart.spec.cy
k6 run k6/load-buy.js
```

## API Contract
- **ID**: `yallmart`
- **Role**: `user` (all authenticated users)
- **Routes**: `/cart`, `/checkout`, `/orders`
