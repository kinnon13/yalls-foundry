import { Suspense, lazy, useMemo, useEffect, useState, useRef, Component, ReactNode } from 'react';
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
  const [sp, setSp] = useSearchParams();
  const rawModule = sp.get('m');
  const m = coerceModule(rawModule);
  const [userId, setUserId] = useState<string | null>(null);
  const [feedWidth, setFeedWidth] = useState(400);
  const [feedHeight, setFeedHeight] = useState(600);
  const [feedRightOffset] = useState(0);
  const [feedTopOffset] = useState(64);
  const [mainContentWidth, setMainContentWidth] = useState<number | null>(null);
  
  const Panel = useMemo(() => panels[m] ?? panels.overview, [m]);

  // Auto-close business module and return to desktop
  useEffect(() => {
    if (m === 'business') {
      setSp({});
    }
  }, [m, setSp]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const appearanceQuery = useAppearance({ 
    type: 'user', 
    id: userId || '00000000-0000-0000-0000-000000000000' 
  });
  
  // Always clear any module param to hide center panel
  useEffect(() => {
    if (rawModule) {
      setSp({});
    }
  }, [rawModule, setSp]);
  
  const isScreenSaverActive = false;

  // Social Feed resizing
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });
  const MIN_W = 320;
  const MIN_H = 400;
  const MIN_MAIN_W = 600;

  type Edge = 'corner' | 'right' | 'left' | 'bottom';

  const onResizeStart = (edge: Edge) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: containerRef.current?.offsetWidth || feedWidth,
      h: containerRef.current?.offsetHeight || feedHeight,
    };
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startRef.current.x;
      const dy = ev.clientY - startRef.current.y;
      let newW = startRef.current.w;
      let newH = startRef.current.h;

      if (edge === 'right' || edge === 'corner') {
        newW = Math.max(MIN_W, startRef.current.w + dx);
      }
      if (edge === 'left') {
        newW = Math.max(MIN_W, startRef.current.w - dx);
      }
      if (edge === 'bottom' || edge === 'corner') {
        newH = Math.max(MIN_H, startRef.current.h + dy);
      }

      setFeedWidth(Math.round(newW));
      setFeedHeight(Math.round(newH));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onMainResizeStart = (side: 'left' | 'right') => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startWidth = mainContentRef.current?.offsetWidth || window.innerWidth - feedWidth;
    const startX = e.clientX;
    
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const newWidth = side === 'right'
        ? Math.max(MIN_MAIN_W, startWidth + dx)
        : Math.max(MIN_MAIN_W, startWidth - dx);
      setMainContentWidth(newWidth);
    };
    
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
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

      {/* Container for resizable areas */}
      <div className="flex-1 relative min-h-0 overflow-hidden flex">
        {/* Main content area - App Grid */}
        <div 
          ref={mainContentRef}
          className="relative overflow-hidden bg-background/50"
          style={{
            width: mainContentWidth || `calc(100vw - ${feedWidth}px)`,
            flexShrink: 0
          }}
        >
          <DashboardErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center h-full"><PanelSkeleton /></div>}>
              <DraggableAppGrid />
            </Suspense>
          </DashboardErrorBoundary>
          
          {/* LEFT EDGE - App Grid */}
          <div
            onPointerDown={onMainResizeStart('left')}
            className="absolute top-0 left-0 bottom-0 w-6 cursor-ew-resize bg-blue-500/40 hover:bg-blue-500/70 transition-colors z-[100] flex items-center justify-center"
            title="◄► Drag to resize app grid (LEFT)"
          >
            <div className="text-white text-xs font-bold rotate-90">LEFT</div>
          </div>
          
          {/* RIGHT EDGE - App Grid */}
          <div
            onPointerDown={onMainResizeStart('right')}
            className="absolute top-0 right-0 bottom-0 w-6 cursor-ew-resize bg-blue-500/40 hover:bg-blue-500/70 transition-colors z-[100] flex items-center justify-center"
            title="◄► Drag to resize app grid (RIGHT)"
          >
            <div className="text-white text-xs font-bold rotate-90">RIGHT</div>
          </div>
        </div>

        {/* Social Feed - Right side */}
        <div
          ref={containerRef}
          className="relative bg-background border-l-4 border-r-4 border-primary shadow-xl"
          style={{
            width: `${feedWidth}px`,
            height: `${feedHeight}px`,
            flexShrink: 0
          }}
        >
          {/* Feed Header */}
          <div className="h-12 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur select-none">
            <h2 className="font-semibold">Social Feed</h2>
            <div className="text-xs text-muted-foreground">{feedWidth}×{feedHeight}px</div>
          </div>

          {/* Feed Content */}
          <div className="h-[calc(100%-48px)] overflow-hidden">
            <TikTokFeed />
          </div>

          {/* LEFT EDGE - Social Feed */}
          <div
            onPointerDown={onResizeStart('left')}
            className="absolute top-0 left-0 bottom-0 w-6 cursor-ew-resize bg-green-500/40 hover:bg-green-500/70 transition-colors z-[100] flex items-center justify-center"
            title="◄► Drag to resize feed (LEFT)"
          >
            <div className="text-white text-xs font-bold rotate-90">LEFT</div>
          </div>
          
          {/* RIGHT EDGE - Social Feed */}
          <div
            onPointerDown={onResizeStart('right')}
            className="absolute top-0 right-0 bottom-0 w-6 cursor-ew-resize bg-green-500/40 hover:bg-green-500/70 transition-colors z-[100] flex items-center justify-center"
            title="◄► Drag to resize feed (RIGHT)"
          >
            <div className="text-white text-xs font-bold rotate-90">RIGHT</div>
          </div>
          
          {/* BOTTOM EDGE - Social Feed */}
          <div
            onPointerDown={onResizeStart('bottom')}
            className="absolute bottom-0 left-0 right-0 h-6 cursor-ns-resize bg-purple-500/40 hover:bg-purple-500/70 transition-colors z-[100] flex items-center justify-center"
            title="▲▼ Drag to resize feed height"
          >
            <div className="text-white text-xs font-bold">BOTTOM</div>
          </div>
          
          {/* CORNER - Social Feed */}
          <div
            onPointerDown={onResizeStart('corner')}
            className="absolute bottom-0 right-0 h-12 w-12 cursor-nwse-resize bg-red-500/50 hover:bg-red-500/80 transition-colors z-[100] rounded-tl-lg flex items-center justify-center"
            title="↔↕ Drag corner to resize both"
          >
            <div className="text-white text-xs font-bold">⇲</div>
          </div>
        </div>
      </div>

      <DebugOverlay />
      <BottomNav />
    </div>
  );
}
