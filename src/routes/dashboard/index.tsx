import { Suspense, lazy, useMemo, useState, useEffect, Component, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Wallpaper } from '@/components/appearance/Wallpaper';
import { ScreenSaver } from '@/components/appearance/ScreenSaver';
import { useAppearance } from '@/hooks/useAppearance';
import { supabase } from '@/integrations/supabase/client';
import { DraggableAppGrid } from '@/components/desktop/DraggableAppGrid';
import { DebugOverlay } from '@/feature-kernel/DebugOverlay';
import { coerceModule, type ModuleKey } from '@/lib/dashUrl';
import { SideFeed } from '@/components/dashboard/SideFeed';
import { ChatDrawer } from '@/components/dashboard/ChatDrawer';
import { DashFooter } from '@/components/dashboard/DashFooter';
import { Button } from '@/components/ui/button';
import { X, MessageSquare } from 'lucide-react';
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
  const [chatOpen, setChatOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const Panel = useMemo(() => panels[m] ?? panels.overview, [m]);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Load appearance settings for current user
  const appearanceQuery = useAppearance({ 
    type: 'user', 
    id: userId || '00000000-0000-0000-0000-000000000000' 
  });
  
  const isScreenSaverActive = false; // TODO: Implement screensaver detection

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

      {/* Main content - two column grid */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {m ? (
          /* Module panel view */
          <div className="h-full px-4 py-2 overflow-auto">
            <div className="flex items-center justify-between mb-4">
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
                <X className="w-4 h-4 mr-2" />
                Close Module
              </Button>
            </div>
            <DashboardErrorBoundary>
              <Suspense fallback={<PanelSkeleton />}>
                <Panel />
              </Suspense>
            </DashboardErrorBoundary>
          </div>
        ) : (
          /* Desktop view: apps grid + sidecar feed */
          <div className="h-full grid grid-cols-1 lg:grid-cols-[minmax(640px,1fr)_minmax(420px,520px)] gap-4 px-4 py-4">
            {/* Left: Apps Grid */}
            <div className="relative overflow-auto">
              <DashboardErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-full"><PanelSkeleton /></div>}>
                  <DraggableAppGrid />
                </Suspense>
              </DashboardErrorBoundary>
            </div>

            {/* Right: Sidecar Feed (hidden on mobile/tablet) */}
            <div className="hidden lg:block">
              <SideFeed />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <DashFooter />

      {/* Chat Drawer (overlays) */}
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Floating chat trigger (bottom-right) */}
      {!chatOpen && !m && (
        <button
          onClick={() => setChatOpen(true)}
          className={cn(
            "fixed bottom-20 right-6 z-50",
            "w-14 h-14 rounded-full shadow-lg",
            "bg-primary text-primary-foreground",
            "flex items-center justify-center",
            "hover:scale-110 transition-transform",
            "lg:right-[540px]" // Position left of feed on desktop
          )}
        >
          <MessageSquare className="w-6 h-6" strokeWidth={2} />
        </button>
      )}

      <DebugOverlay />
    </div>
  );
}
