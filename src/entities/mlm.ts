/**
 * MLM (Multi-Level Marketing) Entities
 * 
 * Types for referral tracking, commissions, ranks, and genealogy trees.
 */

import { z } from 'zod';

/**
 * MLM Rank Enum
 */
export const mlmRankEnum = z.enum([
  'unranked',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'executive',
]);
export type MLMRank = z.infer<typeof mlmRankEnum>;

/**
 * MLM Commission Type Enum
 */
export const mlmCommissionTypeEnum = z.enum([
  'platform_buyer_upline',
  'platform_seller_upline',
  'bonus_affiliate_direct',
  'bonus_platform',
  'bonus_affiliate_upline',
]);
export type MLMCommissionType = z.infer<typeof mlmCommissionTypeEnum>;

/**
 * MLM Referral Schema
 */
export const mlmReferralSchema = z.object({
  id: z.string().uuid(),
  referred_user_id: z.string().uuid(),
  referrer_user_id: z.string().uuid(),
  referral_code: z.string(),
  enrolled_at: z.string().datetime(),
  created_at: z.string().datetime(),
});
export type MLMReferral = z.infer<typeof mlmReferralSchema>;

/**
 * MLM Commission Rule Schema
 */
export const mlmCommissionRuleSchema = z.object({
  id: z.string().uuid(),
  commission_type: mlmCommissionTypeEnum,
  percentage: z.number().min(0).max(100),
  min_rank: mlmRankEnum,
  description: z.string().nullable(),
  active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type MLMCommissionRule = z.infer<typeof mlmCommissionRuleSchema>;

/**
 * MLM Rank Requirement Schema
 */
export const mlmRankRequirementSchema = z.object({
  id: z.string().uuid(),
  rank: mlmRankEnum,
  min_personal_volume_cents: z.number().int(),
  min_team_volume_cents: z.number().int(),
  min_direct_referrals: z.number().int(),
  min_active_downline: z.number().int(),
  monthly_bonus_cents: z.number().int(),
  description: z.string().nullable(),
  created_at: z.string().datetime(),
});
export type MLMRankRequirement = z.infer<typeof mlmRankRequirementSchema>;

/**
 * MLM User Stats Schema
 */
export const mlmUserStatsSchema = z.object({
  user_id: z.string().uuid(),
  current_rank: mlmRankEnum,
  personal_volume_cents: z.number().int(),
  team_volume_cents: z.number().int(),
  direct_referrals_count: z.number().int(),
  total_downline_count: z.number().int(),
  active_downline_count: z.number().int(),
  total_commissions_earned_cents: z.number().int(),
  rank_achieved_at: z.string().datetime().nullable(),
  last_calculated_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type MLMUserStats = z.infer<typeof mlmUserStatsSchema>;

/**
 * MLM Commission Schema
 */
export const mlmCommissionSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  buyer_kind: z.enum(['user', 'business']),
  buyer_id: z.string().uuid(),
  seller_kind: z.enum(['user', 'business']),
  seller_id: z.string().uuid(),
  payee_kind: z.enum(['user', 'business']),
  payee_id: z.string().uuid(),
  commission_type: mlmCommissionTypeEnum,
  level: z.number().int().min(0),
  base_amount: z.number(),
  pct_applied: z.number(),
  amount: z.number(),
  status: z.enum(['hold', 'payable', 'paid', 'reversed']),
  hold_until: z.string().datetime(),
  paid_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type MLMCommission = z.infer<typeof mlmCommissionSchema>;

/**
 * Helper: Format commission type for display
 */
export function formatCommissionType(type: MLMCommissionType): string {
  const labels: Record<MLMCommissionType, string> = {
    platform_buyer_upline: 'Platform Fee (Buyer)',
    platform_seller_upline: 'Platform Fee (Seller)',
    bonus_affiliate_direct: 'Bonus (Direct)',
    bonus_platform: 'Bonus (Platform)',
    bonus_affiliate_upline: 'Bonus (Upline)',
  };
  return labels[type];
}

/**
 * Referral Tree Node (for genealogy visualization)
 */
export const referralTreeNodeSchema = z.object({
  user_id: z.string().uuid(),
  level_depth: z.number().int(),
  referral_path: z.array(z.string().uuid()),
  // Extended fields (joined from profiles/stats)
  email: z.string().email().optional(),
  display_name: z.string().optional(),
  current_rank: mlmRankEnum.optional(),
  direct_referrals_count: z.number().int().optional(),
  personal_volume_cents: z.number().int().optional(),
});
export type ReferralTreeNode = z.infer<typeof referralTreeNodeSchema>;

/**
 * Rank Progress (for UI display)
 */
export const rankProgressSchema = z.object({
  current_rank: mlmRankEnum,
  next_rank: mlmRankEnum.nullable(),
  requirements_met: z.object({
    personal_volume: z.boolean(),
    team_volume: z.boolean(),
    direct_referrals: z.boolean(),
    active_downline: z.boolean(),
  }),
  progress_percentage: z.number().min(0).max(100),
  next_rank_requirements: mlmRankRequirementSchema.nullable(),
});
export type RankProgress = z.infer<typeof rankProgressSchema>;

/**
 * Helper: Format cents to USD string
 */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Helper: Get rank color for UI
 */
export function getRankColor(rank: MLMRank): string {
  const colors: Record<MLMRank, string> = {
    unranked: 'text-gray-500',
    bronze: 'text-amber-600',
    silver: 'text-gray-400',
    gold: 'text-yellow-500',
    platinum: 'text-cyan-400',
    diamond: 'text-blue-500',
    executive: 'text-purple-600',
  };
  return colors[rank];
}

/**
 * Helper: Get rank badge styles
 */
export function getRankBadgeClass(rank: MLMRank): string {
  const classes: Record<MLMRank, string> = {
    unranked: 'bg-gray-100 text-gray-700',
    bronze: 'bg-amber-100 text-amber-800',
    silver: 'bg-gray-200 text-gray-800',
    gold: 'bg-yellow-100 text-yellow-800',
    platinum: 'bg-cyan-100 text-cyan-800',
    diamond: 'bg-blue-100 text-blue-800',
    executive: 'bg-purple-100 text-purple-800',
  };
  return classes[rank];
}
