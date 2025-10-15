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
  'direct_sale',
  'level_2',
  'level_3',
  'level_4',
  'level_5',
  'override_bonus',
  'team_bonus',
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
  earner_user_id: z.string().uuid(),
  source_user_id: z.string().uuid(),
  transaction_id: z.string().uuid(),
  commission_type: mlmCommissionTypeEnum,
  level_depth: z.number().int().min(1).max(5),
  amount_cents: z.number().int(),
  percentage_applied: z.number(),
  earner_rank_at_time: mlmRankEnum,
  transaction_amount_cents: z.number().int(),
  paid_out: z.boolean(),
  payout_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
});
export type MLMCommission = z.infer<typeof mlmCommissionSchema>;

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
