import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { NextBestActions } from '@/components/dashboard/NextBestActions';
import { useSession } from '@/lib/auth/context';

export default function DashboardOverview() {
  const { session } = useSession();

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return null;
      
      // Placeholder data until RPC is available
      return {
        gmv_7d: 0,
        gmv_28d: 0,
        capture_rate: 0,
        missed_cents: 0,
        approvals_pending: 0,
        campaigns_scheduled: 0,
        atc_rate: 0,
        rsvp_rate: 0,
      };
    },
    enabled: !!session?.userId,
    refetchInterval: 60000,
  });

  const { data: actions, isLoading: actionsLoading } = useQuery({
    queryKey: ['next-best-actions', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return [];
      
      // Placeholder data until RPC is available
      return [];
    },
    enabled: !!session?.userId,
    refetchInterval: 120000,
  });

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to view your dashboard</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Your daily operations at a glance</p>
      </div>

      <DashboardKPIs kpis={kpis} isLoading={kpisLoading} />
      <NextBestActions actions={actions} isLoading={actionsLoading} />
    </div>
  );
}
