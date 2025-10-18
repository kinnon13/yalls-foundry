import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { DashboardEntitySwitcher } from '@/components/dashboard/DashboardEntitySwitcher';
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs';
import { UpcomingFromNetwork } from '@/components/dashboard/UpcomingFromNetwork';
import { PortalTiles } from '@/components/dashboard/PortalTiles';
import { MyApps } from '@/components/dashboard/MyApps';
import { useRocker } from '@/lib/ai/rocker';
import { useSession } from '@/lib/auth/context';
import { useQuery } from '@tanstack/react-query';

type NBA = { action: string; why: string; cta: string; href: string };

export default function Overview() {
  const [items, setItems] = useState<NBA[]>([]);
  const [loading, setLoading] = useState(true);
  const { log, section } = useRocker();
  const { session } = useSession();

  // Get user's primary entity for app context
  const { data: primaryEntity } = useQuery({
    queryKey: ['user-primary-entity', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return null;
      
      const { data } = await supabase
        .from('entities')
        .select('id')
        .eq('owner_user_id', session.userId)
        .limit(1)
        .single();
      
      return data;
    },
    enabled: !!session?.userId,
  });

  useEffect(() => {
    log('page_view', { section });
  }, [log, section]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc('rocker_next_best_actions', { p_user_id: user.id });
      if (!error && data) {
        const actionsArray = Array.isArray(data) ? data : [];
        setItems(actionsArray.map((r: any) => r as NBA));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <DashboardBreadcrumbs />
          <h1 className="text-2xl md:text-3xl font-bold mt-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">Your daily operations at a glance</p>
        </div>
        <DashboardEntitySwitcher />
      </div>

      <DashboardKPIs kpis={null} isLoading={false} />

      {primaryEntity?.id && <MyApps entityId={primaryEntity.id} />}

      <UpcomingFromNetwork />

      <PortalTiles />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Next Best Actions</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {loading && (
            <div className="rounded-lg border bg-card p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="rounded-lg border bg-card p-6">
              <p className="text-center text-muted-foreground">You're all set for now 🎉</p>
            </div>
          )}
          {items.map((a, i) => (
            <div className="rounded-lg border bg-card p-6 space-y-3" key={i}>
              <div className="font-medium text-lg">{a.cta}</div>
              <p className="text-sm text-muted-foreground">{a.why}</p>
              <a 
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors" 
                href={a.href}
              >
                Do it
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
