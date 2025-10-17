/**
 * Earnings Hook
 * Fetch earnings ledger and events
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import type { EarningsEvent, EarningsLedger } from '@/types/domain';

export function useEarnings() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const { data: ledger, isLoading: ledgerLoading } = useQuery<EarningsLedger>({
    queryKey: ['earnings-ledger', session?.userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('earnings_ledger')
        .select('*')
        .eq('user_id', session?.userId!)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const ledgerData = data as unknown as EarningsLedger;
        return {
          ...ledgerData,
          missed_cents: ledgerData.total_earned_cents - ledgerData.total_captured_cents,
        };
      }

      return {
        user_id: session?.userId!,
        total_earned_cents: 0,
        total_captured_cents: 0,
        pending_cents: 0,
        missed_cents: 0,
        updated_at: new Date().toISOString(),
      };
    },
    enabled: !!session?.userId,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<EarningsEvent[]>({
    queryKey: ['earnings-events', session?.userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('earnings_events')
        .select('*')
        .eq('user_id', session?.userId!)
        .order('occurred_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EarningsEvent[];
    },
    enabled: !!session?.userId,
  });

  const recompute = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc('earnings_recompute', {
        p_user_id: session?.userId!,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['earnings-events'] });
    },
  });

  return {
    ledger,
    events,
    isLoading: ledgerLoading || eventsLoading,
    recompute,
  };
}
