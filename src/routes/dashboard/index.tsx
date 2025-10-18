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
  const [feedWidth, setFeedWidth] = useState(400);
  const [feedRightOffset, setFeedRightOffset] = useState(0);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  
  const Panel = useMemo(() => panels[m] ?? panels.overview, [m]);

  // Handle left edge drag (resize width)
  useEffect(() => {
    if (!isDraggingLeft) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX - feedRightOffset;
      setFeedWidth(Math.max(300, Math.min(800, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, feedRightOffset]);

  // Handle right edge drag (move entire panel)
  useEffect(() => {
    if (!isDraggingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newRightOffset = window.innerWidth - e.clientX;
      setFeedRightOffset(Math.max(0, Math.min(400, newRightOffset)));
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingRight]);

  // Get user ID for appearance settings
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Load user appearance settings
  const { data: appearance } = useAppearance({ 
    type: 'user', 
    id: userId || '' 
  });

  // Update document title on module change
  useEffect(() => {
    const titles: Record<ModuleKey, string> = {
      overview: 'Dashboard Overview',
      business: 'Business Management',
      producers: 'Producers',
      incentives: 'Incentives',
      stallions: 'Stallions',
      farm_ops: 'Farm Operations',
      events: 'Calendar',
      orders: 'Orders',
      earnings: 'Earnings',
      messages: 'Messages',
      approvals: 'Approvals',
      settings: 'Settings',
    };
    document.title = titles[m] || 'Dashboard';
  }, [m]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Wallpaper background - fixed, full screen, z-0 */}
      {appearance?.wallpaper_url && (
        <Wallpaper
          url={appearance.wallpaper_url}
          blur={(appearance.screensaver_payload as any)?.blur}
          dim={(appearance.screensaver_payload as any)?.dim}
        />
      )}

      {/* Blur/dim overlay - only when wallpaper is present */}
      {appearance?.wallpaper_url && (
        <div 
          className="fixed inset-0 z-10 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Screen saver overlay - z-40 */}
      {appearance?.screensaver_payload && (
        <ScreenSaver payload={appearance.screensaver_payload as any} />
      )}

      <GlobalHeader />
      
      {/* Main content area - z-20, with right margin for feed */}
      <div 
        className="relative z-20 h-[calc(100vh-64px)] overflow-auto transition-all duration-200"
        style={{ marginRight: `${feedWidth + feedRightOffset}px` }}
      >
        {rawModule ? (
          <div className="container mx-auto p-6">
            <DashboardErrorBoundary>
              <FeatureErrorBoundary featureId={`dashboard.${m}`}>
                <Suspense fallback={<PanelSkeleton />}>
                  <Panel />
                </Suspense>
              </FeatureErrorBoundary>
            </DashboardErrorBoundary>
          </div>
        ) : (
          <DashboardErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center h-full"><PanelSkeleton /></div>}>
              <DraggableAppGrid />
            </Suspense>
          </DashboardErrorBoundary>
        )}
      </div>

      {/* Left Resize Handle (adjust width) */}
      <div
        className={cn(
          "fixed top-16 h-[calc(100vh-64px)] w-1 bg-border hover:bg-primary/50 cursor-col-resize z-50 transition-colors",
          isDraggingLeft && "bg-primary"
        )}
        style={{ right: `${feedWidth + feedRightOffset}px` }}
        onMouseDown={() => setIsDraggingLeft(true)}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize social feed width"
      >
        <div className="absolute inset-y-0 -left-2 -right-2" />
      </div>

      {/* Social Feed Sidecar - Permanently open */}
      <div
        className="fixed top-16 h-[calc(100vh-64px)] bg-background border-l border-r shadow-xl z-40"
        style={{ 
          width: `${feedWidth}px`,
          right: `${feedRightOffset}px`
        }}
      >
        {/* Feed Header */}
        <div className="h-12 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur">
          <h2 className="font-semibold">Social Feed</h2>
          <div className="text-xs text-muted-foreground">{feedWidth}px</div>
        </div>

        {/* Feed Content */}
        <div className="h-[calc(100%-48px)] overflow-hidden">
          <TikTokFeed />
        </div>
      </div>

      {/* Right Resize Handle (move panel) */}
      <div
        className={cn(
          "fixed top-16 h-[calc(100vh-64px)] w-1 bg-border hover:bg-primary/50 cursor-col-resize z-50 transition-colors",
          isDraggingRight && "bg-primary"
        )}
        style={{ right: `${feedRightOffset}px` }}
        onMouseDown={() => setIsDraggingRight(true)}
        role="separator"
        aria-orientation="vertical"
        aria-label="Move social feed position"
      >
        <div className="absolute inset-y-0 -left-2 -right-2" />
      </div>

      <DebugOverlay />
    </div>
  );
}
