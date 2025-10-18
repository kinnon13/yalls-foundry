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
import Footer from '@/components/layout/Footer';

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
  const [activeTab, setActiveTab] = useState<'following' | 'foryou' | 'shop'>('following');

  // Always clear any module param to hide center panel
  useEffect(() => {
    if (rawModule) {
      setSp({});
    }
  }, [rawModule, setSp]);

  // Listen for swipe events to change tabs
  useEffect(() => {
    const handleSwipe = (e: CustomEvent<'prev' | 'next'>) => {
      const tabs = ['following', 'foryou', 'shop'] as const;
      const currentIndex = tabs.indexOf(activeTab as any);
      
      if (e.detail === 'next' && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      } else if (e.detail === 'prev' && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    };

    window.addEventListener('feed-swipe', handleSwipe as any);
    return () => window.removeEventListener('feed-swipe', handleSwipe as any);
  }, [activeTab]);

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
          className="fixed z-40 right-6 top-[var(--header-h,64px)] h-[calc(100dvh-var(--header-h,64px))] w-[480px] lg:w-[520px] border-l border-border/40 bg-background/70 backdrop-blur rounded-l-xl overflow-hidden"
          data-locked="true"
          aria-label="Social feed"
        >
          {/* Header: profile + totals + scrollable tabs */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/40">
            <div className="px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
                <div className="text-xs min-w-0">
                  <div className="font-medium truncate">{userId ? 'You' : 'Guest'}</div>
                  <div className="opacity-70 text-[10px]">
                    <span className="mr-2">0 Following</span>
                    <span className="mr-2">0 Followers</span>
                    <span>0 Likes</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto no-scrollbar flex-shrink-0">
                <div className="flex gap-1">
                  {(['following', 'foryou', 'shop'] as const).map(k => (
                    <button
                      key={k}
                      onClick={() => setActiveTab(k)}
                      className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                        activeTab === k 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {k === 'foryou' ? 'For You' : k[0].toUpperCase() + k.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <TwoUpFeed feedKey={activeTab} />
        </aside>
      </div>

      <DebugOverlay />
      <BottomNav />
      <Footer />
    </div>
  );
}
