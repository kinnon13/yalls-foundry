import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { Reel } from '@/components/reels/Reel';
import { cn } from '@/lib/utils';
import SocialProfileHeader from './SocialProfileHeader';
import FavoritesSection from './FavoritesSection';
import UserProfileView from './UserProfileView';
import { X } from 'lucide-react';
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
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  // Listen for profile view events
  useEffect(() => {
    const handleViewProfile = (e: CustomEvent) => {
      setViewingUserId(e.detail.userId);
    };
    window.addEventListener('view-profile', handleViewProfile as EventListener);
    return () => window.removeEventListener('view-profile', handleViewProfile as EventListener);
  }, []);

  // Listen for home navigation
  useEffect(() => {
    const handleNavigateHome = () => {
      setViewingUserId(null);
    };
    window.addEventListener('navigate-home', handleNavigateHome);
    return () => window.removeEventListener('navigate-home', handleNavigateHome);
  }, []);

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
    return new Array(20).fill(0).map((_, i) => {
      // Map certain indices to our mock users
      const userId = i === 0 ? 'nature1' : i === 1 ? 'city1' : null;
      
      return {
        id: `${tab}-${i}`,
        userId,
        src: `https://picsum.photos/seed/${tab}-${i}/1080/1920`,
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
      };
    });
  }, [tab]);

  return (
    <section className="relative flex h-full w-full flex-col">
      {/* Mobile close (no global header on mobile) */}
      <button
        onClick={() => navigate('/?mode=manage')}
        className="sm:hidden absolute top-2 right-2 z-20 h-9 w-9 rounded-full border border-border/60 bg-background/70 backdrop-blur grid place-items-center"
        aria-label="Close feed"
      >
        <X className="h-5 w-5" />
      </button>
      {/* Header stack (measured) - hide when viewing other profiles */}
      <div ref={headerRef}>
        {!viewingUserId && (
          <>
            {/* Profile Header - only visible on your feed */}
            <SocialProfileHeader />
            
            {/* Favorites Bar - only visible on your feed */}
            <FavoritesSection />

            {/* Tab indicators integrated with header */}
            <div className="sticky top-0 z-10 flex items-center justify-center gap-2 px-0 py-2 bg-background">
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
          </>
        )}
      </div>

      {/* Feed container - vertical reels or grid based on tab */}
      <div 
        ref={railRef}
        className="relative flex-1 overflow-hidden select-none touch-pan-y"
        style={{ height: feedH ? `${feedH - headerH}px` : '100%' }}
      >
        {viewingUserId ? (
          // Viewing another user's profile
          <UserProfileView 
            userId={viewingUserId} 
            onBack={() => setViewingUserId(null)}
            onViewProfile={(id) => setViewingUserId(id)}
          />
        ) : tab === 'profile' ? (
          // Profile tab: 3-column grid
          <div className="h-full overflow-y-auto overscroll-contain p-px">
            <div className="grid grid-cols-3 gap-px bg-border">
              {items.map((item) => (
                <div key={item.id} className="relative aspect-square bg-background overflow-hidden">
                  <img 
                    src={item.src}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Other tabs: vertical reel feed
          <div 
            className="h-full overflow-y-auto overscroll-contain snap-y snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map((item) => (
              <div 
                key={item.id} 
                className="snap-start snap-always w-full"
                style={{ 
                  height: feedH ? `${feedH - headerH}px` : '100vh',
                  minHeight: feedH ? `${feedH - headerH}px` : '100vh'
                }}
              >
                <Reel 
                  {...item} 
                  onViewProfile={() => {
                    if (item.userId) {
                      setViewingUserId(item.userId);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

