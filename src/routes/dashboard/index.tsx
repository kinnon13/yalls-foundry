import { Suspense, lazy, useMemo, useEffect, useState, Component, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Wallpaper } from '@/components/appearance/Wallpaper';
import { ScreenSaver } from '@/components/appearance/ScreenSaver';
import { useAppearance } from '@/hooks/useAppearance';
import { supabase } from '@/integrations/supabase/client';
import { DraggableAppGrid } from '@/components/desktop/DraggableAppGrid';
import { DebugOverlay } from '@/feature-kernel/DebugOverlay';
import { TwoUpFeed } from '@/components/dashboard/TwoUpFeed';
import { BottomNav } from '@/components/layout/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

class DashboardErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border rounded-md bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100">
          <h3 className="font-semibold mb-2">Dashboard Component Error</h3>
          <p className="text-sm">{this.state.error?.message || 'Something went wrong'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function PanelSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-muted rounded w-full mb-2"></div>
      <div className="h-4 bg-muted rounded w-5/6"></div>
    </div>
  );
}

export default function DashboardLayout() {
  const [sp, setSp] = useSearchParams();
  const rawModule = sp.get('m');
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('following');

  // Always clear any module param to hide center panel
  useEffect(() => {
    if (rawModule) {
      setSp({});
    }
  }, [rawModule, setSp]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const appearanceQuery = useAppearance({ 
    type: 'user', 
    id: userId || '00000000-0000-0000-0000-000000000000' 
  });
  
  const isScreenSaverActive = false;

  // Guard: if a builder tries to move nodes, snap them back
  useEffect(() => {
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return;

    const fix = () => {
      const apps = document.getElementById('apps-pane');
      const feed = document.getElementById('sidefeed-pane');
      if (apps && apps.parentElement !== grid) grid.appendChild(apps);
      if (feed && feed.parentElement !== grid) grid.appendChild(feed);
    };

    const obs = new MutationObserver(fix);
    obs.observe(document.body, { childList: true, subtree: true });
    fix();
    return () => obs.disconnect();
  }, []);

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Wallpaper */}
      <div className="fixed inset-0 -z-10">
        <Wallpaper />
      </div>

      {/* Screen Saver */}
      {isScreenSaverActive && <ScreenSaver />}

      {/* Global header */}
      <GlobalHeader />

      {/* Hard-locked grid shell - APPS LEFT, FEED RIGHT */}
      <div
        id="dashboard-grid"
        className="grid h-[calc(100dvh-var(--header-h,64px))] gap-4 grid-cols-[minmax(640px,1fr)_minmax(420px,520px)] px-4 overflow-hidden"
      >
        {/* Apps Pane - LEFT */}
        <section id="apps-pane" className="min-w-[640px] overflow-auto">
          <DashboardErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center h-full"><PanelSkeleton /></div>}>
              <DraggableAppGrid />
            </Suspense>
          </DashboardErrorBoundary>
        </section>

        {/* Social Feed - RIGHT (LOCKED) */}
        <aside
          id="sidefeed-pane"
          className="sticky top-[var(--header-h,64px)] h-[calc(100dvh-var(--header-h,64px))] overflow-hidden rounded-xl border border-border/40 bg-background/60 backdrop-blur"
          data-locked="true"
        >
          {/* Tabs for feed types */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 h-12 rounded-none border-b">
              <TabsTrigger value="following" className="text-sm">Following</TabsTrigger>
              <TabsTrigger value="foryou" className="text-sm">For You</TabsTrigger>
              <TabsTrigger value="shop" className="text-sm">Shop</TabsTrigger>
            </TabsList>
            
            <TabsContent value="following" className="flex-1 overflow-hidden m-0">
              <TwoUpFeed feedKey="following" />
            </TabsContent>
            
            <TabsContent value="foryou" className="flex-1 overflow-hidden m-0">
              <TwoUpFeed feedKey="foryou" />
            </TabsContent>
            
            <TabsContent value="shop" className="flex-1 overflow-hidden m-0">
              <TwoUpFeed feedKey="shop" />
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      <DebugOverlay />
      <BottomNav />
    </div>
  );
}
