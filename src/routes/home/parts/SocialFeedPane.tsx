import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';

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
    const el = railRef.current; if (!el) return;
    let down: {x:number;y:number}|null = null;
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      down = null;
      if (Math.abs(dx) > Math.abs(dy) * 1.3 && Math.abs(dx) > 60) {
        const i = TABS.indexOf(tab);
        if (dx < 0 && i < TABS.length - 1) setTab(TABS[i + 1]);
        if (dx > 0 && i > 0) setTab(TABS[i - 1]);
      }
    };
    el.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    return () => { el.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp); };
  }, [tab]);

  // persist state in URL (?feed=…&entity=…)
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set('feed', tab);
    if (entityId) next.set('entity', entityId); else next.delete('entity');
    setSp(next, { replace: true });
  }, [tab, entityId]); // eslint-disable-line react-hooks/exhaustive-deps

  // totals above feed (combine across connected accounts later)
  const totals = useMemo(() => ({ following: 0, followers: 0, likes: 0, views: 0 }), []);

  return (
    <div className="relative" ref={railRef}>
      {/* profile + totals header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted" />
          <div className="text-sm">
            <div className="font-medium">{tab === 'profile' ? 'Your profile' : session ? 'You' : 'Guest'}</div>
            <div className="text-xs text-muted-foreground">
              {totals.following} Following · {totals.followers} Followers · {totals.likes} Likes
            </div>
          </div>
        </div>
        {/* Tabs (clickable + swipeable) */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-8 px-3 rounded-full text-xs border font-medium transition-colors ${t===tab ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 hover:bg-accent/40'}`}
            >
              {t==='for-you' ? 'For You' : t[0].toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Reels feed={tab} entityId={entityId} onEntityChange={setEntityId} />
    </div>
  );
}

/** One post per screen, snap scrolling, overlay actions */
function Reels({
  feed, entityId, onEntityChange
}: { feed: 'following'|'for-you'|'shop'|'profile'; entityId: string|null; onEntityChange?: (id:string)=>void }) {
  // TODO: wire real queries; placeholder images prove sizing/UX
  const items = new Array(20).fill(0).map((_,i)=>({
    id: `${feed}-${i}`,
    img: `https://picsum.photos/seed/${feed}-${i}/900/1600`,
    caption: `${feed} • post #${i+1}`,
    likes: Math.floor(Math.random() * 1000),
    comments: Math.floor(Math.random() * 100),
  }));

  return (
    <div
      className="relative h-[calc(100vh-14rem)] overflow-y-auto snap-y snap-mandatory pb-4
                 [scrollbar-width:thin]"
      // keyboard up/down
      onKeyDown={(e) => {
        const scroller = e.currentTarget;
        if (e.key === 'ArrowDown') scroller.scrollBy({ top: scroller.clientHeight, behavior: 'smooth' });
        if (e.key === 'ArrowUp') scroller.scrollBy({ top: -scroller.clientHeight, behavior: 'smooth' });
      }}
      tabIndex={0}
      aria-label="Social feed"
    >
      {items.map(card => (
        <article key={card.id} className="snap-start h-[calc(100vh-14rem)] relative">
          {/* media fills the panel, no rounded masks */}
          <img src={card.img} alt="" className="absolute inset-0 w-full h-full object-cover select-none" draggable={false} loading="lazy" />

          {/* gradient for legibility */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

          {/* right-side action cluster like TikTok */}
          <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4 text-white">
            <IconBtn label="Like">
              ❤️
              <span className="text-xs mt-1">{card.likes}</span>
            </IconBtn>
            <IconBtn label="Comment">
              💬
              <span className="text-xs mt-1">{card.comments}</span>
            </IconBtn>
            <IconBtn label="Save">🔖</IconBtn>
            <IconBtn label="Repost">🔁</IconBtn>
            <IconBtn label="Share">↗︎</IconBtn>
          </div>

          {/* caption / username */}
          <div className="absolute left-3 bottom-4 text-white text-sm drop-shadow-lg">
            <div className="font-semibold">{card.caption}</div>
          </div>
        </article>
      ))}
    </div>
  );
}

function IconBtn({ children, label }: {children: React.ReactNode; label: string}) {
  return (
    <button 
      aria-label={label} 
      className="grid place-items-center h-10 w-10 rounded-full bg-black/40 backdrop-blur hover:scale-110 active:scale-95 transition-transform"
    >
      <div className="text-center text-lg leading-none">{children}</div>
    </button>
  );
}
