import { Suspense, lazy, useMemo, useEffect, useState, Component, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Wallpaper } from '@/components/appearance/Wallpaper';
import { ScreenSaver } from '@/components/appearance/ScreenSaver';
import { useAppearance } from '@/hooks/useAppearance';
import { supabase } from '@/integrations/supabase/client';
import { DraggableAppGrid } from '@/components/desktop/DraggableAppGrid';
import { DebugOverlay } from '@/feature-kernel/DebugOverlay';
import { FeatureErrorBoundary } from '@/feature-kernel/ErrorBoundary';
import { coerceModule, type ModuleKey } from '@/lib/dashUrl';
import { TikTokFeed } from '@/components/social/TikTokFeed';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const panels = {
  overview: lazy(() => import('./overview')),
  business: lazy(() => import('./business')),
  producers: lazy(() => import('./producers')),
  incentives: lazy(() => import('./incentives')),
  stallions: lazy(() => import('./stallions')),
  farm_ops: lazy(() => import('./farm-ops')),
  events: lazy(() => import('./events')),
  orders: lazy(() => import('./orders')),
  earnings: lazy(() => import('./earnings')),
  messages: lazy(() => import('../messages')),
  approvals: lazy(() => import('./approvals')),
  settings: lazy(() => import('./settings')),
} as const;

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
  const [sp] = useSearchParams();
  const rawModule = sp.get('m');
  const m = coerceModule(rawModule);
  const [userId, setUserId] = useState<string | null>(null);
  const [feedWidth] = useState(400);
  const [feedHeight] = useState(600);
  const [feedRightOffset] = useState(0);
  const [feedTopOffset] = useState(64);
  
  const Panel = useMemo(() => panels[m] ?? panels.overview, [m]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const appearanceQuery = useAppearance({ 
    type: 'user', 
    id: userId || '00000000-0000-0000-0000-000000000000' 
  });
  
  const isScreenSaverActive = false;

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

      {/* Main content area */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {m ? (
          <div className="h-full overflow-auto">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.history.back()}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Desktop
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    params.delete('m');
                    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
                    window.location.reload();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <DashboardErrorBoundary>
                <Suspense fallback={<PanelSkeleton />}>
                  <Panel />
                </Suspense>
              </DashboardErrorBoundary>
            </div>
          </div>
        ) : (
          <DashboardErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center h-full"><PanelSkeleton /></div>}>
              <DraggableAppGrid />
            </Suspense>
          </DashboardErrorBoundary>
        )}
      </div>

      {/* Social Feed Sidecar - Fixed overlay (dimensions locked) */}
      <div
        className="fixed bg-background border-l border-r shadow-xl z-40"
        style={{ 
          width: `${feedWidth}px`,
          height: `${feedHeight}px`,
          right: `${feedRightOffset}px`,
          top: `${feedTopOffset}px`
        }}
      >
        {/* Feed Header (locked - no drag) */}
        <div className="h-12 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur select-none">
          <h2 className="font-semibold">Social Feed</h2>
          <div className="text-xs text-muted-foreground">{feedWidth}×{feedHeight}px (Locked)</div>
        </div>

        {/* Feed Content */}
        <div className="h-[calc(100%-48px)] overflow-hidden">
          <TikTokFeed />
        </div>
      </div>

      <DebugOverlay />
      <BottomNav />
    </div>
  );
}
