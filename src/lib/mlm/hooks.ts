/**
 * MLM Hooks - Query affiliate tree and commission data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TreeNode {
  user_id: string;
  party_kind: 'user' | 'business';
  party_id: string;
  depth: number;
  path: string[];
  total_orders: number;
  total_sales: number;
  commission_earned: number;
}

interface CommissionSummary {
  total_earned: number;
  pending: number;
  payable: number;
  total_orders: number;
  level_breakdown: Record<string, number>;
}

interface LeaderboardEntry {
  party_kind: 'user' | 'business';
  party_id: string;
  display_name: string;
  total_orders: number;
  total_sales: number;
  rank: number;
}

export function useMyDownlineTree(maxDepth = 10) {
  return useQuery({
    queryKey: ['mlm-tree', maxDepth],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_downline_tree' as any, {
        p_max_depth: maxDepth,
      });

      if (error) throw error;
      return data as TreeNode[];
    },
  });
}

export function useCommissionSummary() {
  return useQuery({
    queryKey: ['commission-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_commission_summary' as any);
      if (error) throw error;
      return data as CommissionSummary;
    },
  });
}

export function useDownlineLeaderboard(metric: 'sales' | 'orders' = 'sales', limit = 10) {
  return useQuery({
    queryKey: ['downline-leaderboard', metric, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_downline_leaderboard' as any, {
        p_metric: metric,
        p_limit: limit,
      });

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
  });
}

export function useCommissionLedger(status?: 'hold' | 'payable' | 'paid') {
  return useQuery({
    queryKey: ['commission-ledger', status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('commission_ledger' as any)
        .select('*')
        .eq('payee_kind', 'user')
        .eq('payee_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
