import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { Reel } from '@/components/reels/Reel';
import { cn } from '@/lib/utils';

const TABS = ['following', 'for-you', 'shop', 'profile'] as const;
type Tab = typeof TABS[number];

export default function SocialFeedPane() {
  const { session } = useSession();
  const [sp, setSp] = useSearchParams();
  const initialTab = (sp.get('feed') as Tab) || 'following';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [entityId, setEntityId] = useState<string | null>(sp.get('entity') || null);

  // swipe left/right to switch tabs
  const railRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - down.x,
        dy = e.clientY - down.y;
      down = null;
      if (Math.abs(dx) > Math.abs(dy) * 1.3 && Math.abs(dx) > 60) {
        const i = TABS.indexOf(tab);
        if (dx < 0 && i < TABS.length - 1) setTab(TABS[i + 1]);
        if (dx > 0 && i > 0) setTab(TABS[i - 1]);
      }
    };
    el.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [tab]);

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
    <section className="flex h-full w-full flex-col" ref={railRef}>
      {/* Profile summary above feed */}
      <ProfileSummaryBar />

      {/* Tabs (clickable + swipeable) */}
      <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-background/70 backdrop-blur px-2 py-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              t === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {t === 'for-you' ? 'For You' : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground hidden md:inline">Swipe ◀︎ ▶︎</span>
      </div>

      {/* Reel list container with vertical snap */}
      <div className="relative flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide">
        <div className="space-y-4 px-2 pb-4">
          {items.map((item) => (
            <div key={item.id} className="h-[calc(100vh-16rem)] snap-start">
              <Reel {...item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Profile summary bar with aggregated stats */
function ProfileSummaryBar() {
  const [stats] = useState({
    name: 'You',
    avatar: undefined,
    following: 124,
    followers: 987,
    likes: 3204,
  });

  return (
    <div className="flex items-center gap-3 px-2 py-2 border-b border-border/60">
      {stats.avatar ? (
        <img src={stats.avatar} className="h-8 w-8 rounded-full object-cover" alt="" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-muted" />
      )}
      <div className="text-sm font-medium">{stats.name}</div>
      <div className="ml-2 grid auto-cols-max grid-flow-col gap-4 text-xs text-muted-foreground">
        <div>
          <span className="font-semibold text-foreground">{stats.following}</span> Following
        </div>
        <div>
          <span className="font-semibold text-foreground">{stats.followers}</span> Followers
        </div>
        <div>
          <span className="font-semibold text-foreground">{stats.likes}</span> Likes
        </div>
      </div>
    </div>
  );
}
