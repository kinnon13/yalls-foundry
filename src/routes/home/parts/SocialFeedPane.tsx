import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
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
  const [feedH, setFeedH] = useState<number | null>(null);

  // measured header stack height (profile header + favorites + tabs)
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState(0);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderH(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

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

  // Measure available height between this container's top and the BottomDock
  useLayoutEffect(() => {
    const recalc = () => {
      const railEl = railRef.current;
      if (!railEl) return;
      const rect = railEl.getBoundingClientRect();
      const viewportH = window.visualViewport?.height ?? window.innerHeight;
      const bottomDock = document.querySelector('nav[aria-label="Bottom dock"]') as HTMLElement | null;
      const bottomH = bottomDock ? bottomDock.getBoundingClientRect().height : 0;
      const h = Math.max(0, Math.round(viewportH - bottomH - rect.top));
      setFeedH(h);
    };

    recalc();

    const ro = new ResizeObserver(recalc);
    if (railRef.current) ro.observe(railRef.current);
    const bottomDock = document.querySelector('nav[aria-label="Bottom dock"]') as HTMLElement | null;
    if (bottomDock) ro.observe(bottomDock);

    window.addEventListener('resize', recalc);
    window.visualViewport?.addEventListener('resize', recalc);
    window.visualViewport?.addEventListener('scroll', recalc);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recalc);
      window.visualViewport?.removeEventListener('resize', recalc);
      window.visualViewport?.removeEventListener('scroll', recalc);
    };
  }, []);

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
    const themes = ['nature', 'city', 'fashion', 'food', 'travel', 'art', 'fitness', 'tech'];
    return new Array(20).fill(0).map((_, i) => ({
      id: `${tab}-${i}`,
      src: `https://images.unsplash.com/photo-${1500000000000 + i * 1000000}?w=1080&h=1920&fit=crop&auto=format&q=80`,
      author: {
        name: `${themes[i % themes.length]} Creator ${i + 1}`,
        handle: `${themes[i % themes.length].toLowerCase()}${i + 1}`,
        avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
      },
      caption: `Amazing ${themes[i % themes.length]} content for ${tab} feed 🔥 #${themes[i % themes.length]} #${tab}`,
      stats: {
        likes: Math.floor(Math.random() * 50000) + 1000,
        comments: Math.floor(Math.random() * 5000) + 100,
        saves: Math.floor(Math.random() * 2000) + 50,
        reposts: Math.floor(Math.random() * 1000) + 25,
      },
    }));
  }, [tab]);

  return (
    <section className="flex h-full w-full flex-col">
      {/* Header stack (measured) */}
      <div ref={headerRef}>
        {/* Profile Header */}
        <SocialProfileHeader />
        
        {/* Favorites Bar */}
        <FavoritesSection />

        {/* Tab indicators (clickable or drag/swipe to change) */}
        <div className="sticky top-0 z-10 flex items-center justify-center gap-2 px-0 py-1">
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

      {/* Swipeable feed container */}
      <div 
        ref={railRef}
        className="relative flex-1 overflow-hidden select-none touch-pan-y"
        style={{ height: feedH ? `${feedH}px` : '100%' }}
      >
        <div 
          className="h-full overflow-y-auto overscroll-contain snap-y snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => (
            <div 
              key={item.id} 
              className="snap-start snap-always w-full"
              style={{ 
                height: feedH ? `${feedH}px` : '100vh',
                minHeight: feedH ? `${feedH}px` : '100vh'
              }}
            >
              <Reel {...item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

