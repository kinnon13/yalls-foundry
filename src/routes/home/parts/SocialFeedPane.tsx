import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, MessageCircle, Bookmark, Repeat2, Share2 } from 'lucide-react';

export default function SocialFeedPane() {
  const [tab, setTab] = useState<'following'|'for-you'|'shop'>('following');

  // fake items placeholder; wire to real data later
  const items = useMemo(() => new Array(30).fill(0).map((_,i)=>({
    id: `${tab}-${i}`,
    img: `https://picsum.photos/seed/${tab}-${i}/900/1600`,
    caption: `${tab} • post #${i+1}`,
    likes: Math.floor(Math.random()*1000),
    comments: Math.floor(Math.random()*100)
  })), [tab]);

  // Horizontal swipe between tabs
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (e.deltaX > 0 && tab !== 'shop') setTab(tab === 'following' ? 'for-you' : 'shop');
        if (e.deltaX < 0 && tab !== 'following') setTab(tab === 'shop' ? 'for-you' : 'following');
      }
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => el.removeEventListener('wheel', onWheel);
  }, [tab]);

  return (
    <div className="h-full w-full overflow-y-auto overscroll-contain">
      {/* Profile bubble + totals + tabs */}
      <div ref={tabsRef} className="sticky top-0 z-10 bg-background/85 backdrop-blur px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-muted ring-1 ring-border" />
            <div className="text-xs text-muted-foreground">
              <div className="font-medium text-foreground">You</div>
              <div>0 Following • 0 Followers • 0 Likes</div>
            </div>
          </div>
          {/* tabs */}
          <div className="flex gap-2">
            {(['following','for-you','shop'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  t===tab ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'
                }`}
              >
                {t === 'for-you' ? 'For You' : t[0].toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reels list (edge-to-edge in its column) */}
      <ul className="mx-auto max-w-[520px] w-full px-0 py-3 flex flex-col gap-4">
        {items.map(card => (
          <li key={card.id} className="relative w-full aspect-[9/16] rounded-lg overflow-hidden">
            <img src={card.img} className="absolute inset-0 w-full h-full object-cover" alt="" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />
            {/* right actions */}
            <div className="absolute right-2 bottom-24 flex flex-col items-center gap-3 text-white">
              <IconBtn label="Like"><Heart className="w-5 h-5" /></IconBtn>
              <span className="text-xs">{card.likes}</span>
              <IconBtn label="Comment"><MessageCircle className="w-5 h-5" /></IconBtn>
              <span className="text-xs">{card.comments}</span>
              <IconBtn label="Save"><Bookmark className="w-5 h-5" /></IconBtn>
              <IconBtn label="Repost"><Repeat2 className="w-5 h-5" /></IconBtn>
              <IconBtn label="Share"><Share2 className="w-5 h-5" /></IconBtn>
            </div>
            {/* caption */}
            <div className="absolute left-3 bottom-3 pr-16 text-white text-sm">{card.caption}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IconBtn({ children, label }: {children: React.ReactNode; label: string}) {
  return (
    <button
      aria-label={label}
      title={label}
      className="grid place-items-center size-10 rounded-full bg-black/35 hover:bg-black/50 border border-white/20 transition-colors"
    >
      {children}
    </button>
  );
}
