# Yallspay - MLM Residual Payment Guide

## Overview

Yallspay handles payment processing with automatic 3-tier MLM commission splitting. Every transaction distributes residuals to upline members according to the commission structure.

## Commission Structure

### Direct Sale (Level 1)
- **Upline1**: 10% of transaction amount
- Example: $100 sale → $10 to upline1

### Second Tier (Level 2)
- **Upline2**: 20% of upline1's commission
- Example: $100 sale → $10 to upline1 → $2 to upline2

### Third Tier (Level 3)
- **Upline3**: 30% of upline2's commission
- Example: $100 sale → $10 to upline1 → $2 to upline2 → $0.60 to upline3

### Platform Fee
- **Platform**: 5% of transaction amount
- Example: $100 sale → $5 to platform

### User Receives
- **User**: Transaction amount - upline1 commission - platform fee
- Example: $100 sale → $85 to user ($100 - $10 - $5)

## Integration

```typescript
import { processPayment } from '@/yallspay/services/yallpay.service';

const paymentId = await processPayment({
  userId: 'user123',
  amount: 100,
  productId: 'prod_abc',
  gateway: 'stripe',
  uplineChain: ['upline1', 'upline2', 'upline3'],
});

console.log('Payment ID:', paymentId);
```

## Payout Process

1. **Daily Batch**: Runs at 2 AM via `scripts/payout-batch.py`
2. **Minimum Payout**: $50 (configurable)
3. **Gateways**: Stripe (ACH), Venmo
4. **Processing Time**: 3-5 business days

## Security

Access is gated by OPA policy (`sec/pay-rbac.rego`). Users can only view/request payouts for their own account. Admins have full access.

## Testing

```bash
# Run commission split tests
npx cypress run --spec cypress/e2e/pay.spec.cy.ts

# Load test (1K transactions)
k6 run k6/load-txn.js
```
