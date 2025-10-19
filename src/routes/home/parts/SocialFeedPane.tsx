import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { Reel } from '@/components/reels/Reel';
import { cn } from '@/lib/utils';
import ProfileSummaryBar from './ProfileSummaryBar';

const TABS = ['following', 'for-you', 'shop', 'profile'] as const;
type Tab = typeof TABS[number];

export default function SocialFeedPane() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const initialTab = (sp.get('feed') as Tab) || 'following';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [entityId, setEntityId] = useState<string | null>(sp.get('entity') || null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [feedHeight, setFeedHeight] = useState(() => 
    Number(localStorage.getItem('feed.itemHeight') || 600)
  );
  const [feedWidth, setFeedWidth] = useState(() => 
    Number(localStorage.getItem('feed.itemWidth') || 400)
  );
  const [resizing, setResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('feed.itemHeight', String(feedHeight));
  }, [feedHeight]);

  useEffect(() => {
    localStorage.setItem('feed.itemWidth', String(feedWidth));
  }, [feedWidth]);

  const startResize = (e: React.MouseEvent, edge: 'width' | 'height' | 'both') => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = feedWidth;
    const startH = feedHeight;
    setResizing(true);
    
    const onMove = (ev: MouseEvent) => {
      if (edge === 'width' || edge === 'both') {
        const w = Math.max(200, Math.min(800, startW + (ev.clientX - startX)));
        setFeedWidth(w);
      }
      if (edge === 'height' || edge === 'both') {
        const h = Math.max(300, Math.min(1200, startH + (ev.clientY - startY)));
        setFeedHeight(h);
      }
    };
    
    const onUp = () => {
      setResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // seamless drag/swipe gesture for tab switching
  const railRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent | TouchEvent) => {
      const p = 'touches' in e ? e.touches[0] : e;
      startRef.current = { x: p.clientX, y: p.clientY };
      setIsDragging(false);
      setDragOffset(0);
    };

    const onMove = (e: PointerEvent | TouchEvent) => {
      if (!startRef.current) return;
      const p = 'touches' in e ? e.touches[0] : e;
      const dx = p.clientX - startRef.current.x;
      const dy = p.clientY - startRef.current.y;

      // Start dragging if horizontal movement dominates
      if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 10) {
        setIsDragging(true);
        setDragOffset(dx);
        if ('preventDefault' in e) e.preventDefault();
      }
    };

    const onUp = (e: PointerEvent | TouchEvent) => {
      if (!startRef.current) return;
      const p = 'changedTouches' in e ? e.changedTouches[0] : e;
      const dx = p.clientX - startRef.current.x;
      startRef.current = null;

      // Switch tab if dragged far enough (80px threshold)
      if (isDragging && Math.abs(dx) > 80) {
        const i = TABS.indexOf(tab);
        if (dx < 0 && i < TABS.length - 1) setTab(TABS[i + 1]);
        if (dx > 0 && i > 0) setTab(TABS[i - 1]);
      }

      setIsDragging(false);
      setDragOffset(0);
    };

    el.addEventListener('pointerdown', onDown, { passive: true });
    el.addEventListener('touchstart', onDown, { passive: true });
    el.addEventListener('pointermove', onMove, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('pointerup', onUp, { passive: true });
    el.addEventListener('touchend', onUp, { passive: true });
    el.addEventListener('pointercancel', onUp, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('touchend', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [tab, isDragging]);

  // persist state in URL (?feed=…&entity=…)
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set('feed', tab);
    if (entityId) next.set('entity', entityId);
    else next.delete('entity');
    setSp(next, { replace: true });
  }, [tab, entityId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate placeholder data based on tab
  const items = useMemo(() => {
    return new Array(20).fill(0).map((_, i) => ({
      id: `${tab}-${i}`,
      src: `https://picsum.photos/seed/${tab}-${i}/900/1600`,
      author: {
        name: `User ${i + 1}`,
        handle: `user${i + 1}`,
      },
      caption: `This is a sample post for ${tab} • #${i + 1}`,
      stats: {
        likes: Math.floor(Math.random() * 10000),
        comments: Math.floor(Math.random() * 1000),
        saves: Math.floor(Math.random() * 500),
        reposts: Math.floor(Math.random() * 300),
      },
    }));
  }, [tab]);

  return (
    <section className="flex h-full w-full flex-col text-[hsl(222.2_47.4%_11.2%)] overflow-hidden">
      {/* Sticky header (Home + Profile + Tabs) */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-3 py-1">
          <button
            onClick={() => navigate('/home')}
            className="text-base font-semibold hover:text-primary transition-colors"
          >
            Home
          </button>
          <h3 className="text-base font-semibold text-center">View Connected Accounts</h3>
          <div className="w-[60px]" aria-hidden />
        </div>
        <ProfileSummaryBar />
        <div className="mb-1 flex items-center justify-center gap-2 pr-2 py-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                t === tab
                  ? 'bg-primary text-primary-foreground scale-105'
                  : 'bg-muted/50 text-muted-foreground scale-95 hover:bg-muted hover:scale-100'
              )}
            >
              {t === 'for-you' ? 'For You' : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Swipeable feed container - SCROLLABLE */}
      <div 
        ref={railRef}
        className="relative flex-1 overflow-y-auto select-none touch-pan-y bg-black"
      >
        <div 
          className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        >
          <div className="flex flex-col items-center">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="snap-start snap-always relative shrink-0 w-full md:w-auto" 
                style={{ 
                  height: isMobile ? '100vh' : isTablet ? '100vh' : `${feedHeight}px`,
                  width: isMobile ? '100vw' : isTablet ? '100vw' : `${feedWidth}px`
                }}
              >
                <Reel {...item} />
                
                {/* Resize Handles - only on desktop (not tablet) */}
                {!isMobile && !isTablet && (
                  <>
                    <div 
                      onMouseDown={(e) => startResize(e, 'width')}
                      className="absolute right-0 top-0 bottom-0 w-2 border-r-2 border-dashed border-primary/50 hover:border-primary cursor-ew-resize z-10"
                      title="Drag to resize width"
                    />
                    <div 
                      onMouseDown={(e) => startResize(e, 'height')}
                      className="absolute left-0 right-0 bottom-0 h-2 border-b-2 border-dashed border-primary/50 hover:border-primary cursor-ns-resize z-10"
                      title="Drag to resize height"
                    />
                    <div 
                      onMouseDown={(e) => startResize(e, 'both')}
                      className="absolute right-0 bottom-0 w-4 h-4 border-r-2 border-b-2 border-dashed border-primary/70 hover:border-primary cursor-nwse-resize z-10 rounded-bl"
                      title="Drag to resize both"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

