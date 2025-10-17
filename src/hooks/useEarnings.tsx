/**
 * Earnings Hook
 * Fetch earnings ledger and events
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

export interface EarningsEvent {
  id: string;
  kind: string;
  amount_cents: number;
  currency: string;
  captured: boolean;
  occurred_at: string;
  metadata: Record<string, any>;
}

export interface EarningsLedger {
  total_earned_cents: number;
  total_captured_cents: number;
  pending_cents: number;
  missed_cents: number;
}

export function useEarnings() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ['earnings-ledger', session?.userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('earnings_ledger')
        .select('*')
        .eq('user_id', session?.userId!)
        .maybeSingle();

      if (error) throw error;

      return data
        ? {
            total_earned_cents: data.total_earned_cents,
            total_captured_cents: data.total_captured_cents,
            pending_cents: data.pending_cents,
            missed_cents: data.total_earned_cents - data.total_captured_cents,
          }
        : {
            total_earned_cents: 0,
            total_captured_cents: 0,
            pending_cents: 0,
            missed_cents: 0,
          };
    },
    enabled: !!session?.userId,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['earnings-events', session?.userId],
    queryFn: async () => {
      const { data, error } = await supabase
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
      const { data, error } = await supabase.rpc('earnings_recompute', {
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
