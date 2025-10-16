/**
 * MLM Service (Supabase)
 * 
 * Handles referral tree operations, commission tracking, rank calculations.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  MLMReferral,
  MLMUserStats,
  MLMCommission,
  ReferralTreeNode,
  MLMRankRequirement,
  MLMCommissionRule,
  RankProgress,
} from '@/entities/mlm';

/**
 * Get current user's MLM stats
 */
export async function getMyMLMStats(): Promise<MLMUserStats | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;

  const { data, error } = await (supabase as any)
    .from('mlm_user_stats')
    .select('*')
    .eq('user_id', session.session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch MLM stats:', error);
    return null;
  }

  return data;
}

/**
 * Get user's referral tree (downline)
 */
export async function getMyReferralTree(maxDepth: number = 5): Promise<ReferralTreeNode[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error('Not authenticated');

  const { data, error } = await (supabase as any).rpc('get_referral_tree', {
    p_user_id: session.session.user.id,
    p_max_depth: maxDepth,
  });

  if (error) {
    console.error('Failed to fetch referral tree:', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Get user's direct referrals (level 1 only)
 */
export async function getMyDirectReferrals(): Promise<MLMReferral[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];

  const { data, error } = await (supabase as any)
    .from('mlm_referrals')
    .select('*')
    .eq('referrer_user_id', session.session.user.id)
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch direct referrals:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's earned commissions
 */
export async function getMyCommissions(filters?: {
  paidOut?: boolean;
  limit?: number;
}): Promise<MLMCommission[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];

  let query = (supabase as any)
    .from('mlm_commissions')
    .select('*')
    .eq('earner_user_id', session.session.user.id)
    .order('created_at', { ascending: false });

  if (filters?.paidOut !== undefined) {
    query = query.eq('paid_out', filters.paidOut);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch commissions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all rank requirements (for displaying progression)
 */
export async function getRankRequirements(): Promise<MLMRankRequirement[]> {
  const { data, error } = await (supabase as any)
    .from('mlm_rank_requirements')
    .select('*')
    .order('min_personal_volume_cents', { ascending: true });

  if (error) {
    console.error('Failed to fetch rank requirements:', error);
    return [];
  }

  return data || [];
}

/**
 * Get active commission rules
 */
export async function getCommissionRules(): Promise<MLMCommissionRule[]> {
  const { data, error } = await (supabase as any)
    .from('mlm_commission_rules')
    .select('*')
    .eq('active', true)
    .order('commission_type', { ascending: true });

  if (error) {
    console.error('Failed to fetch commission rules:', error);
    return [];
  }

  return data || [];
}

/**
 * Calculate user's rank progress
 */
export async function getMyRankProgress(): Promise<RankProgress | null> {
  const stats = await getMyMLMStats();
  const requirements = await getRankRequirements();

  if (!stats || !requirements.length) return null;

  // Find current rank requirements
  const currentReq = requirements.find((r) => r.rank === stats.current_rank);
  if (!currentReq) return null;

  // Find next rank
  const rankOrder = ['unranked', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'executive'];
  const currentIndex = rankOrder.indexOf(stats.current_rank);
  const nextRankName = currentIndex < rankOrder.length - 1 ? rankOrder[currentIndex + 1] : null;
  const nextReq = nextRankName ? requirements.find((r) => r.rank === nextRankName) : null;

  if (!nextReq) {
    // Already at max rank
    return {
      current_rank: stats.current_rank,
      next_rank: null,
      requirements_met: {
        personal_volume: true,
        team_volume: true,
        direct_referrals: true,
        active_downline: true,
      },
      progress_percentage: 100,
      next_rank_requirements: null,
    };
  }

  // Calculate progress
  const requirementsMet = {
    personal_volume: stats.personal_volume_cents >= nextReq.min_personal_volume_cents,
    team_volume: stats.team_volume_cents >= nextReq.min_team_volume_cents,
    direct_referrals: stats.direct_referrals_count >= nextReq.min_direct_referrals,
    active_downline: stats.active_downline_count >= nextReq.min_active_downline,
  };

  const metCount = Object.values(requirementsMet).filter(Boolean).length;
  const progressPercentage = (metCount / 4) * 100;

  return {
    current_rank: stats.current_rank,
    next_rank: nextReq.rank as any,
    requirements_met: requirementsMet,
    progress_percentage: progressPercentage,
    next_rank_requirements: nextReq,
  };
}

/**
 * Generate unique referral code for user
 */
export async function generateReferralCode(): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error('Not authenticated');

  // Simple code: first 8 chars of user ID
  const code = session.session.user.id.slice(0, 8).toUpperCase();
  return code;
}

/**
 * Get referral link for user
 */
export async function getMyReferralLink(): Promise<string> {
  const code = await generateReferralCode();
  return `${window.location.origin}/login?ref=${code}`;
}

/**
 * Subscribe to MLM stats updates (realtime)
 */
export function subscribeToMyMLMStats(callback: (stats: MLMUserStats) => void) {
  const getSession = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return null;
    return session.session;
  };

  getSession().then((session) => {
    if (!session) return;

    const channel = (supabase as any)
      .channel(`mlm_stats:${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mlm_user_stats',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload: any) => {
          callback(payload.new as MLMUserStats);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  });

  return () => {}; // No-op cleanup for sync path
}
