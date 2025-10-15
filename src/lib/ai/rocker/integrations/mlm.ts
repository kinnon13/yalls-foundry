/**
 * Rocker Integration: MLM & Referrals
 * 
 * Connects affiliate operations to Rocker for transparency and tracking.
 */

import { logRockerEvent } from '../bus';

export async function rockerReferralCreated(params: {
  userId: string;
  referralId: string;
  referredUserId: string;
  sessionId?: string;
}): Promise<void> {
  await logRockerEvent('mlm.referral.created', params.userId, {
    referralId: params.referralId,
    referredUserId: params.referredUserId,
  }, params.sessionId);

  // Rocker should:
  // - Show referral chain
  // - Explain commission structure
}

export async function rockerPayoutTriggered(params: {
  userId: string;
  amount: number;
  reason: string;
  sessionId?: string;
}): Promise<void> {
  await logRockerEvent('mlm.payout.triggered', params.userId, {
    amount: params.amount,
    reason: params.reason,
  }, params.sessionId);

  // Rocker confirms payout
}
