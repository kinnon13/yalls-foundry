/**
 * Rocker Integration: MLM & Referrals
 * 
 * Connects affiliate operations to Rocker for transparency and tracking.
 */

import { emitRockerEvent } from '../bus';

export async function rockerReferralCreated(params: {
  userId: string;
  referralId: string;
  referredUserId: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('mlm.referral.created', params.userId, {
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
  commissionType?: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('mlm.payout.triggered', params.userId, {
    amount: params.amount,
    reason: params.reason,
    commissionType: params.commissionType,
  }, params.sessionId);

  // Rocker confirms payout
  // Commission types:
  // - platform_buyer_upline: 4% of platform fee to buyer's upline
  // - platform_seller_upline: 4% of platform fee to seller's upline
  // - bonus_affiliate_direct: 80% of seller bonus to affiliate
  // - bonus_platform: 10% of seller bonus to platform
  // - bonus_affiliate_upline: 10% of seller bonus to affiliate's upline
}
