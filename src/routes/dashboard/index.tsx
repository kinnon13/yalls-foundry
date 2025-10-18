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
import { BottomDock } from '@/components/layout/BottomDock';
import Footer from '@/components/layout/Footer';
import BubbleRailTop from '@/components/social/BubbleRailTop';

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
  
  // Social feed position and size state
  const [feedPosition, setFeedPosition] = useState({ x: window.innerWidth - 540, y: 64 });
  const [feedSize, setFeedSize] = useState({ width: 520, height: window.innerHeight - 64 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent) => {
    // Don't start drag from interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button, a, input, textarea, select, [data-nodrag], .no-drag') ||
      (target as HTMLElement).getAttribute('contenteditable') === 'true'
    ) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - feedPosition.x, y: e.clientY - feedPosition.y });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent) => {
      setFeedPosition({
        x: Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - feedSize.width)),
        y: Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - feedSize.height))
      });
    };

    const handleDragEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragStart, feedSize]);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setFeedSize(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;
        let newX = feedPosition.x;
        let newY = feedPosition.y;

        if (isResizing.includes('left')) {
          newWidth = Math.max(320, prev.width - deltaX);
          newX = feedPosition.x + deltaX;
        }
        if (isResizing.includes('right')) {
          newWidth = Math.max(320, prev.width + deltaX);
        }
        if (isResizing.includes('bottom') || isResizing.includes('corner')) {
          newHeight = Math.max(400, prev.height + deltaY);
        }
        if (isResizing.includes('top')) {
          newHeight = Math.max(400, prev.height - deltaY);
          newY = feedPosition.y + deltaY;
        }

        setFeedPosition(p => ({ ...p, x: newX, y: newY }));
        return { width: newWidth, height: newHeight };
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleResizeEnd = () => setIsResizing(null);

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, dragStart, feedPosition]);

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
        className="grid h-[calc(100dvh-var(--header-h,64px))] gap-4 grid-cols-[minmax(640px,1fr)] px-4 overflow-hidden"
      >
        {/* Apps Pane - LEFT */}
        <section id="apps-pane" className="min-w-[640px] overflow-auto pr-[500px] lg:pr-[540px] pb-16">
          {/* NEW: profile bubbles at the very top */}
          <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border/40">
            <BubbleRailTop />
          </div>

          {/* give bubbles some breathing room */}
          <div className="h-3" />

          {/* Apps grid now starts lower on the page */}
          <DashboardErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center h-full"><PanelSkeleton /></div>}>
              <DraggableAppGrid />
            </Suspense>
          </DashboardErrorBoundary>
        </section>

        {/* Social Feed - DRAGGABLE & RESIZABLE */}
        <aside
          id="sidefeed-pane"
          style={{
            left: `${feedPosition.x}px`,
            top: `${feedPosition.y}px`,
            width: `${feedSize.width}px`,
            height: `${feedSize.height}px`
          }}
          className="fixed z-40 border border-border/40 bg-background/70 backdrop-blur rounded-xl overflow-hidden shadow-2xl"
          aria-label="Social feed"
          onMouseDown={handleDragStart}
        >
          {/* Drag Handle Header */}
          <div 
            className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/40 cursor-move"
            onMouseDown={handleDragStart}
          >
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
                      onMouseDown={(e) => e.stopPropagation()}
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

          {/* Resize Handles */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-500/20 hover:bg-blue-500/40 transition-colors"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-green-500/20 hover:bg-green-500/40 transition-colors"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
          <div
            className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize bg-purple-500/20 hover:bg-purple-500/40 transition-colors"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          <div
            className="absolute left-0 right-0 top-0 h-2 cursor-ns-resize bg-purple-500/20 hover:bg-purple-500/40 transition-colors"
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          />
          <div
            className="absolute right-0 bottom-0 w-4 h-4 cursor-nwse-resize bg-red-500/30 hover:bg-red-500/50 transition-colors"
            onMouseDown={(e) => handleResizeStart(e, 'corner-right-bottom')}
          />
        </aside>
      </div>

      <DebugOverlay />
      <BottomDock />
      <Footer />
    </div>
  );
}
