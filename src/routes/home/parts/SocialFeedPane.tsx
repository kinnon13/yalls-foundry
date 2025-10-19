import { useEffect, useMemo, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { Reel } from '@/components/reels/Reel';
import { cn } from '@/lib/utils';
import SocialProfileHeader from './SocialProfileHeader';
import FavoritesSection from './FavoritesSection';

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
  
  // Reel sizing state (strict 9:16)
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [reelDims, setReelDims] = useState<{ width: number; height: number } | null>(null);
  
  // Measure pane and header to compute exact reel size
  const measureReel = useCallback(() => {
    const pane = containerRef.current;
    const header = headerRef.current;
    if (!pane || !header) return;
    
    const paneRect = pane.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    
    const paneW = paneRect.width;
    const paneH = paneRect.height;
    const headerH = headerRect.height;
    const availH = paneH - headerH;
    
    // Strict 9:16 aspect ratio
    const reelH = Math.min(availH, paneW * (16 / 9));
    const reelW = reelH * (9 / 16);
    
    setReelDims({ width: reelW, height: reelH });
  }, []);
  
  useLayoutEffect(() => {
    measureReel();
    
    const ro = new ResizeObserver(measureReel);
    if (containerRef.current) ro.observe(containerRef.current);
    if (headerRef.current) ro.observe(headerRef.current);
    
    window.addEventListener('resize', measureReel);
    window.visualViewport?.addEventListener('resize', measureReel);
    
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureReel);
      window.visualViewport?.removeEventListener('resize', measureReel);
    };
  }, [measureReel]);
  
  // Re-measure when tab changes (header might resize)
  useEffect(() => {
    measureReel();
  }, [tab, measureReel]);

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
    <section ref={containerRef} className="h-full w-full flex flex-col overflow-hidden min-h-0">
      {/* Header stack (measured for reel sizing) */}
      <div ref={headerRef} className="flex-shrink-0">
        <SocialProfileHeader />
        <FavoritesSection />
        <div className="flex items-center justify-center gap-2 px-0 py-1">
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

      {/* Reel scroller - strict 9:16 sizing */}
      <div 
        ref={railRef}
        className="flex-1 overflow-y-auto overscroll-contain snap-y snap-mandatory scrollbar-hide min-h-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex flex-col" style={{ paddingBottom: '16px' }}>
          {reelDims && items.map((item) => (
            <div 
              key={item.id} 
              className="snap-start flex-shrink-0 flex items-center justify-center"
              style={{ 
                height: `${reelDims.height}px`,
                width: '100%'
              }}
            >
              <div style={{ width: `${reelDims.width}px`, height: `${reelDims.height}px` }}>
                <Reel {...item} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

