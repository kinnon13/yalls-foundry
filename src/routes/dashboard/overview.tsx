import { useQuery } from '@tanstack/react-query';
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { NextBestActions } from '@/components/dashboard/NextBestActions';
import { DashboardEntitySwitcher } from '@/components/dashboard/DashboardEntitySwitcher';
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs';
import { useSession } from '@/lib/auth/context';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { rpcWithObs } from '@/lib/supaRpc';
import RPCHealthCard from '@/components/dashboard/cards/RPCHealth';

export default function DashboardOverview() {
  const { session } = useSession();
  const { isLoading: roleLoading } = useRoleGuard();

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return null;
      
      const { data, error } = await rpcWithObs('dashboard_kpis', {
        p_user_id: session.userId
      }, { surface: 'dashboard_overview' });
      
      if (error) throw error;
      return data as unknown as {
        gmv_7d: number;
        gmv_28d: number;
        capture_rate: number;
        missed_cents: number;
        approvals_pending: number;
        campaigns_scheduled: number;
        atc_rate: number;
        rsvp_rate: number;
      } | null;
    },
    enabled: !!session?.userId,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: actions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ['next-best-actions', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return [];
      
      const { data, error } = await rpcWithObs('rocker_next_best_actions', {
        p_user_id: session.userId
      }, { surface: 'dashboard_overview' });
      
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        id: string;
        title: string;
        rationale: string;
        impact_score: number;
        cta: {
          rpc: string;
          params: Record<string, any>;
        };
      }>;
    },
    enabled: !!session?.userId,
    refetchInterval: 120000,
    staleTime: 60000,
  });

  if (!session || roleLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <DashboardBreadcrumbs />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">Your daily operations at a glance</p>
        </div>
        <DashboardEntitySwitcher />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardKPIs kpis={kpis} isLoading={kpisLoading} />
        <RPCHealthCard />
      </div>
      <NextBestActions actions={actions} isLoading={actionsLoading} />
    </div>
  );
}
