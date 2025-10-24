/**
 * Role: Yallspay section contract - MLM residual payment system
 * Path: yalls-inc/yallspay/src/contract.ts
 */

export const YallspayContract = {
  id: 'yallspay',
  name: 'Yallspay',
  version: '1.0.0',
  role: 'user', // Default role, escalates for payouts
  features: {
    commissionSplitting: '3-tier MLM (10/20/30/5%)',
    paymentGateways: ['stripe', 'venmo'],
    residualTracking: true,
    batchPayouts: 'Daily at 2 AM',
  },
  dependencies: ['@/lib/shared'],
  exports: {
    Entry: './app/pay/page.tsx',
    Panel: './components/PayoutCard.tsx',
  },
} as const;
