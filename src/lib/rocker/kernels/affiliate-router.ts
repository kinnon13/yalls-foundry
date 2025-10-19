/**
 * Affiliate Router Kernel
 * Tracks referrals and allocates tiered commissions
 */

interface KernelContext {
  events: {
    recent: (type: string, limit: number) => any[];
  };
  commands: {
    invoke: (app: string, action: string, params: any) => Promise<any>;
  };
}

const COMMISSION_TIERS = {
  bronze: { min: 0, max: 5, rate: 0.05 },
  silver: { min: 5, max: 20, rate: 0.08 },
  gold: { min: 20, max: 50, rate: 0.12 },
  platinum: { min: 50, max: Infinity, rate: 0.15 }
};

export async function runAffiliateRouter(ctx: KernelContext) {
  const shareClicks = ctx.events.recent('share_click', 50);
  const purchases = ctx.events.recent('purchase_complete', 100);
  
  if (!shareClicks.length && !purchases.length) {
    return;
  }

  // Process share clicks for tracking
  for (const share of shareClicks) {
    const { userId, referralCode, itemId } = share.detail || {};
    if (userId && referralCode) {
      await ctx.commands.invoke('earnings', 'track_referral', {
        referrer_id: userId,
        referral_code: referralCode,
        item_id: itemId,
        timestamp: share.timestamp
      });
    }
  }

  // Process completed purchases for commission
  for (const purchase of purchases) {
    const { userId, referralCode, amount, purchaseId } = purchase.detail || {};
    if (referralCode && amount) {
      const tier = determineTier(userId);
      const commission = calculateCommission(amount, tier);
      
      await ctx.commands.invoke('earnings', 'allocate_tier_commission', {
        referrer_id: userId,
        purchase_id: purchaseId,
        amount_cents: amount,
        commission_cents: commission,
        tier,
        referral_code: referralCode
      });
    }
  }
}

function determineTier(userId: string): keyof typeof COMMISSION_TIERS {
  // TODO: Query user's referral count from database
  const referralCount = 0; // Placeholder
  
  for (const [tier, config] of Object.entries(COMMISSION_TIERS)) {
    if (referralCount >= config.min && referralCount < config.max) {
      return tier as keyof typeof COMMISSION_TIERS;
    }
  }
  
  return 'bronze';
}

function calculateCommission(amountCents: number, tier: keyof typeof COMMISSION_TIERS): number {
  const rate = COMMISSION_TIERS[tier].rate;
  return Math.round(amountCents * rate);
}
