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
    <div className="min-h-screen bg-background">
      {/* macOS window chrome */}
      <div className="sticky top-0 z-50 backdrop-blur-2xl bg-background/70 border-b border-border/40 shadow-sm">
        <div className="px-4 py-2.5 flex items-center gap-4">
          {/* Traffic lights */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:bg-[#FEBC2E]/80 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-[#28C840] hover:bg-[#28C840]/80 transition-colors" />
          </div>
          
          {/* Window title - centered */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-[13px] font-medium text-foreground/80 tracking-tight">Dashboard</h1>
          </div>
          
          {/* Entity switcher */}
          <div>
            <DashboardEntitySwitcher />
          </div>
        </div>
      </div>

      {/* Main content - macOS style spacing */}
      <div className="px-8 py-6 space-y-8">
        {/* Collections */}
        <section>
          <CollectionsBar />
        </section>

        {/* My Apps */}
        {primaryEntity?.id && (
          <section>
            <MyApps entityId={primaryEntity.id} />
          </section>
        )}

        {/* Network tiles */}
        <section>
          <PortalTiles />
        </section>

        {/* Upcoming events */}
        <section>
          <UpcomingFromNetwork />
        </section>

        {/* Next Best Actions */}
        {(loading || items.length > 0) && (
          <section className="space-y-3">
            <h2 className="text-[15px] font-semibold text-foreground/90 px-1">Suggested</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {loading && (
                <div className="rounded-xl bg-muted/30 p-5 border border-border/30">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </div>
              )}
              {items.map((a, i) => (
                <a
                  href={a.href}
                  key={i}
                  className="group rounded-xl bg-card/40 backdrop-blur-sm border border-border/30 p-5 space-y-2.5 hover:bg-card/60 hover:border-border/50 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                >
                  <div className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                    {a.cta}
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
                    {a.why}
                  </p>
                  <div className="inline-flex items-center text-[11px] font-medium text-primary">
                    Do it
                    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
