import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { DashboardEntitySwitcher } from '@/components/dashboard/DashboardEntitySwitcher';
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs';
import { UpcomingFromNetwork } from '@/components/dashboard/UpcomingFromNetwork';
import { PortalTiles } from '@/components/dashboard/PortalTiles';
import { MyApps } from '@/components/dashboard/MyApps';
import { CollectionsBar } from '@/components/dashboard/CollectionsBar';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mac-style header bar */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <h1 className="text-sm font-medium">Dashboard</h1>
          </div>
          <DashboardEntitySwitcher />
        </div>
      </div>

      {/* iOS-style app grid container */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Collections (folders) */}
        <CollectionsBar />

        {/* My Apps grid */}
        {primaryEntity?.id && <MyApps entityId={primaryEntity.id} />}

        {/* Portal/Network tiles */}
        <PortalTiles />

        {/* Upcoming events - compact */}
        <UpcomingFromNetwork />

        {/* Next Best Actions - iOS card style */}
        {(loading || items.length > 0) && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold px-2">Suggested</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {loading && (
                <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                </div>
              )}
              {items.map((a, i) => (
                <div 
                  className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 space-y-3 hover:bg-card/80 transition-all hover:scale-[1.02] hover:shadow-lg" 
                  key={i}
                >
                  <div className="font-medium text-base">{a.cta}</div>
                  <p className="text-sm text-muted-foreground">{a.why}</p>
                  <a 
                    className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors" 
                    href={a.href}
                  >
                    Do it
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
