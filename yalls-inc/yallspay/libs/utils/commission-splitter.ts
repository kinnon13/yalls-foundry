/**
 * Role: MLM commission splitter - 3-tier residual calculator
 * Path: yalls-inc/yallspay/libs/utils/commission-splitter.ts
 */

export interface CommissionSplit {
  user: number; // Amount user receives after splits
  upline1: number; // Direct upline (10%)
  upline2: number; // Second tier (20% of upline1)
  upline3: number; // Third tier (30% of upline2)
  platform: number; // Platform fee (5%)
  total: number; // Should equal transactionAmount
}

export interface SplitInput {
  transactionAmount: number;
  userId: string;
  uplineChain: string[]; // [direct, second, third]
}

/**
 * Calculate MLM commission splits for a transaction
 * 
 * Structure:
 * - User receives: transaction - upline1 - platform fee
 * - Upline1 receives: 10% of transaction
 * - Upline2 receives: 20% of upline1's commission
 * - Upline3 receives: 30% of upline2's commission
 * - Platform receives: 5% of transaction
 */
export function splitCommission(input: SplitInput): CommissionSplit {
  const { transactionAmount } = input;

  // Platform fee (5%)
  const platform = transactionAmount * 0.05;

  // Level 1: Direct upline (10% of transaction)
  const upline1 = transactionAmount * 0.10;

  // Level 2: Second tier (20% of upline1's commission)
  const upline2 = upline1 * 0.20;

  // Level 3: Third tier (30% of upline2's commission)
  const upline3 = upline2 * 0.30;

  // User receives remaining amount
  const user = transactionAmount - upline1 - platform;

  return {
    user: parseFloat(user.toFixed(2)),
    upline1: parseFloat(upline1.toFixed(2)),
    upline2: parseFloat(upline2.toFixed(2)),
    upline3: parseFloat(upline3.toFixed(2)),
    platform: parseFloat(platform.toFixed(2)),
    total: transactionAmount,
  };
}

/**
 * Validate upline chain (max 3 levels)
 */
export function validateUplineChain(chain: string[]): boolean {
  return chain.length <= 3 && chain.every((id) => id.length > 0);
}

/**
 * Calculate total residuals for a user from downline transactions
 */
export function calculateResiduals(
  userId: string,
  transactions: Array<{ amount: number; uplinePosition: 1 | 2 | 3 }>
): number {
  let total = 0;

  for (const txn of transactions) {
    if (txn.uplinePosition === 1) {
      total += txn.amount * 0.10; // 10% direct
    } else if (txn.uplinePosition === 2) {
      total += txn.amount * 0.10 * 0.20; // 20% of upline1's 10%
    } else if (txn.uplinePosition === 3) {
      total += txn.amount * 0.10 * 0.20 * 0.30; // 30% of upline2's commission
    }
  }

  return parseFloat(total.toFixed(2));
}
