# Yallspay - MLM Residual Payment System

**Role**: Payment processing with 3-tier MLM commission splitting  
**Path**: `yalls-inc/yallspay/`

## Features

- **3-Tier Commission Splitting**: Automatic 10/20/30/5% residual distribution
- **Stripe/Venmo Integration**: Dual payment gateway support (stub)
- **Daily Batch Payouts**: Automated residual processing via cron
- **Residual Tracker**: Real-time payout dashboard with transaction history
- **Transaction Load Testing**: k6 for 1K concurrent transaction simulations

## Architecture

```
yallspay/
├── src/
│   ├── app/pay/page.tsx              # Residual tracker UI
│   ├── components/PayoutCard.tsx     # Payout summary card
│   ├── services/yallpay.service.ts   # Payment processing logic
│   └── contract.ts                   # Section contract
├── libs/utils/commission-splitter.ts # MLM split calculator
├── scripts/payout-batch.py           # Daily residual batch worker
├── cypress/e2e/pay.spec.cy.ts        # Split logic tests
├── k6/load-txn.js                    # 1K transaction load test
├── ops/backup-pay.sh                 # Payment ledger backup
└── sec/pay-rbac.rego                 # Payment access policies
```

## MLM Commission Structure

- **Level 1** (Direct): 10% of transaction
- **Level 2** (Second tier): 20% of Level 1's commission
- **Level 3** (Third tier): 30% of Level 2's commission
- **Platform Fee**: 5% of total transaction

## Usage

```typescript
import { splitCommission } from '@/yallspay/libs/utils/commission-splitter';

const splits = splitCommission({
  transactionAmount: 100,
  userId: 'user123',
  uplineChain: ['upline1', 'upline2', 'upline3'],
});

console.log(splits);
// {
//   user: 85,    // 100 - 10 - 5 = 85
//   upline1: 10, // 10% of 100
//   upline2: 2,  // 20% of 10
//   upline3: 0.6, // 30% of 2
//   platform: 5, // 5% of 100
// }
```

## Testing

```bash
# E2E split tests
npx cypress run --spec cypress/e2e/pay.spec.cy.ts

# Load test (1K transactions)
k6 run k6/load-txn.js
```

## Deployment

```bash
./ops/backup-pay.sh  # Backup ledger before deploy
```
