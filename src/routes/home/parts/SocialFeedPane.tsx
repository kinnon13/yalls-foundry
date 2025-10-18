import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const TABS = ['following', 'for-you', 'shop'] as const;
type Tab = typeof TABS[number];

export default function SocialFeedPane() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('following');
  const railRef = useRef<HTMLDivElement>(null);
  const down = useRef<{x:number;y:number}|null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Swipe left/right to change tab (feed stays in place)
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => (down.current = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down.current) return;
      const dx = e.clientX - down.current.x;
      const dy = e.clientY - down.current.y;
      down.current = null;
      if (Math.abs(dx) > Math.abs(dy) * 1.3 && Math.abs(dx) > 60) {
        const idx = TABS.indexOf(tab);
        if (dx < 0 && idx < TABS.length - 1) setTab(TABS[idx + 1]);
        if (dx > 0 && idx > 0) setTab(TABS[idx - 1]);
      }
    };

    el.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [tab]);

  // Header with profile bubble + totals
  const totals = useMemo(() => ({ following: 0, followers: 0, likes: 0, views: 0 }), []);

  return (
    <div ref={railRef} className="relative h-full">
      {/* Profile summary */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted" aria-hidden />
          <div className="text-sm">
            <div className="font-medium">{userId ? 'You' : 'Guest'}</div>
            <div className="text-xs text-muted-foreground">
              {totals.following} Following · {totals.followers} Followers · {totals.likes} Likes
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Following / For You / Shop */}
      <div className="flex gap-2 mb-3">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'h-8 px-3 rounded-full border text-xs font-medium transition-colors',
              tab===t ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 hover:bg-accent/40'
            )}
          >
            {t === 'for-you' ? 'For You' : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* 2-up feed cards */}
      <div className="grid gap-3">
        <TwoUpFeed feedType={tab} />
      </div>
    </div>
  );
}

function TwoUpFeed({ feedType }: { feedType: 'following'|'for-you'|'shop' }) {
  // Placeholder items - replace with real query
  const items = new Array(16).fill(0).map((_,i)=>({
    id:`${feedType}-${i}`, 
    img:`https://picsum.photos/seed/${feedType}-${i}/800/1200`,
    likes: Math.floor(Math.random() * 1000),
    comments: Math.floor(Math.random() * 100),
  }));

  return (
    <div className="grid gap-3">
      {chunk(items, 2).map((row, rowIdx) => (
        <div key={`row-${rowIdx}`} className="grid grid-cols-2 gap-3">
          {row.map(card => (
            <article key={card.id} className="rounded-lg border border-border/60 overflow-hidden bg-card hover:border-primary/40 transition-colors">
              <div className="relative w-full aspect-[9/16] md:aspect-[3/4]">
                <img
                  src={card.img}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                  loading="lazy"
                />
              </div>
              {/* Action buttons */}
              <div className="flex items-center justify-between px-3 py-2 bg-background/80 backdrop-blur">
                <div className="flex gap-3 text-xs">
                  <button aria-label="Like" className="hover:scale-110 transition-transform">
                    ❤️ <span className="text-muted-foreground">{card.likes}</span>
                  </button>
                  <button aria-label="Comment" className="hover:scale-110 transition-transform">
                    💬 <span className="text-muted-foreground">{card.comments}</span>
                  </button>
                  <button aria-label="Save" className="hover:scale-110 transition-transform">
                    🔖
                  </button>
                  <button aria-label="Share" className="hover:scale-110 transition-transform">
                    ↗︎
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}

function chunk<T>(arr: T[], n: number) {
  return arr.reduce((rows: T[][], item, i) => {
    if (i % n === 0) rows.push([]);
    rows[rows.length - 1].push(item);
    return rows;
  }, []);
}
