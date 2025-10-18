import { useEffect, useMemo, useRef } from 'react';
import { usePinnedBubblesInfinite } from '@/hooks/usePinnedBubblesInfinite';
import { useNavigate } from 'react-router-dom';

type Props = {
  userId: string | null;
  readOnly?: boolean;
  onOpenOverride?: (id: string) => void;
  size?: number;
  gap?: number;
  mockWhenEmpty?: boolean;
};

export function PinnedBubblesRail({ 
  userId, 
  readOnly = false, 
  onOpenOverride, 
  size = 72, 
  gap = 12,
  mockWhenEmpty = false 
}: Props) {
  const nav = useNavigate();
  const railRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = usePinnedBubblesInfinite(userId, 32);

  // flatten pages
  const items = useMemo(() => {
    const real = (data?.pages ?? []).flatMap(p => p.items);
    if (real.length || !mockWhenEmpty) return real;
    // mock 16 bubbles
    return Array.from({ length: 16 }).map((_, i) => ({
      id: `mock:${i}`,
      display_name: `Sample ${i + 1}`,
      handle: null,
      kind: 'business' as const,
      avatar_url: null,
      is_public: true,
    }));
  }, [data, mockWhenEmpty]);

  // infinite load when nearing the end (IntersectionObserver inside horizontal scroller)
  useEffect(() => {
    if (!railRef.current || !endRef.current || !hasNextPage) return;
    const io = new IntersectionObserver(
      entries => {
        const [e] = entries;
        if (e.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: railRef.current, rootMargin: '600px', threshold: 0.0 }
    );
    io.observe(endRef.current);
    return () => io.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  // smooth horizontal wheel
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const open = (id: string) => {
    if (readOnly || id.startsWith('mock:')) return;
    if (onOpenOverride) return onOpenOverride(id);
    nav(`/entities/${id}`);
  };

  if (items.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto no-scrollbar" ref={railRef} role="listbox" aria-label="Pinned favorites">
      <div className="flex items-center" style={{ gap }}>
        {items.map(b => {
          const initials = b.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          return (
            <button
              key={b.id}
              onClick={() => open(b.id)}
              className="relative shrink-0 rounded-full border border-border/60 overflow-hidden hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
              style={{ width: size, height: size }}
              title={b.display_name}
              role="option"
              aria-label={`Open ${b.display_name}`}
            >
              {b.avatar_url ? (
                <img src={b.avatar_url} alt={b.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center bg-gradient-to-br from-primary/20 to-primary/5 text-foreground/80 text-lg font-medium">
                  {initials}
                </div>
              )}
              {b.is_public && (
                <span className="absolute -right-1 -bottom-1 text-[10px] px-1.5 py-[2px] rounded bg-primary text-primary-foreground font-medium">
                  Public
                </span>
              )}
            </button>
          );
        })}

        {/* Sentinel for infinite load */}
        <div ref={endRef} style={{ width: 1, height: size }} />
      </div>
    </div>
  );
}
