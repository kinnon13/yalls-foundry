import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { Heart, MessageCircle, Bookmark, Repeat2, Share2 } from 'lucide-react';

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

/** One post per screen, snap scrolling, premium action rail */
function Reels({
  feed, entityId, onEntityChange
}: { feed: 'following'|'for-you'|'shop'|'profile'; entityId: string|null; onEntityChange?: (id:string)=>void }) {
  // TODO: wire real queries; placeholder images prove sizing/UX
  const items = new Array(20).fill(0).map((_,i)=>({
    id: `${feed}-${i}`,
    img: `https://picsum.photos/seed/${feed}-${i}/900/1600`,
    author: { name: `User ${i+1}`, handle: `user${i+1}` },
    caption: `This is a sample post for ${feed} • #${i+1}`,
    likes: Math.floor(Math.random() * 10000),
    comments: Math.floor(Math.random() * 1000),
    saves: Math.floor(Math.random() * 500),
    reposts: Math.floor(Math.random() * 300),
  }));

  return (
    <div
      className="relative h-[calc(100vh-14rem)] overflow-y-auto snap-y snap-mandatory scrollbar-hide"
      // keyboard up/down
      onKeyDown={(e) => {
        const scroller = e.currentTarget;
        if (e.key === 'ArrowDown') scroller.scrollBy({ top: scroller.clientHeight, behavior: 'smooth' });
        if (e.key === 'ArrowUp') scroller.scrollBy({ top: -scroller.clientHeight, behavior: 'smooth' });
      }}
      tabIndex={0}
      aria-label="Social feed"
    >
      {items.map(item => (
        <Reel key={item.id} {...item} />
      ))}
    </div>
  );
}

/** Premium reel card with full-bleed media and TikTok-style actions */
function Reel({ img, author, caption, likes, comments, saves, reposts }: {
  img: string;
  author: { name: string; handle?: string; avatar?: string };
  caption?: string;
  likes: number;
  comments: number;
  saves: number;
  reposts: number;
}) {
  const [liked, setLiked] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);

  const doubleTapLike = () => {
    setLiked(true);
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 420);
  };

  return (
    <article
      className="relative w-full h-[calc(100vh-14rem)] snap-start bg-black"
      onDoubleClick={doubleTapLike}
    >
      {/* MEDIA: full-bleed, no rounded corners */}
      <img 
        src={img} 
        alt="" 
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover select-none"
      />

      {/* HEART BURST on double-tap */}
      {heartBurst && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Heart className="h-24 w-24 text-white/90 animate-ping" fill="currentColor" />
        </div>
      )}

      {/* TOP GRADIENT + AUTHOR */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
      <header className="absolute top-3 left-3 right-[88px] flex items-center gap-3">
        {author.avatar
          ? <img src={author.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          : <div className="h-8 w-8 rounded-full bg-white/20" />}
        <div className="min-w-0">
          <div className="truncate text-white font-medium leading-tight text-sm">{author.name}</div>
          {author.handle && <div className="truncate text-white/70 text-xs">@{author.handle}</div>}
        </div>
      </header>

      {/* BOTTOM GRADIENT + CAPTION */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
      {caption && (
        <p className="absolute bottom-3 left-3 right-[88px] text-white/90 text-sm leading-snug line-clamp-3">
          {caption}
        </p>
      )}

      {/* ACTION RAIL - premium TikTok style */}
      <ActionRail
        liked={liked}
        stats={{ likes, comments, saves, reposts }}
        onLike={() => setLiked(v => !v)}
        onComment={() => console.log('comment')}
        onSave={() => console.log('save')}
        onRepost={() => console.log('repost')}
      />
    </article>
  );
}

/** Format numbers (1.2k, 3.4m) */
function format(n: number) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'm';
  if (n >= 1_000) return (n/1_000).toFixed(1).replace(/\.0$/,'') + 'k';
  return String(n);
}

/** Action rail button component */
function RailBtn({ label, icon, active, onClick }: {
  label: string; 
  icon: React.ReactNode; 
  active?: boolean; 
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="group flex flex-col items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-2xl"
    >
      <div className={`
        grid place-items-center h-12 w-12 rounded-2xl backdrop-blur-md transition-transform
        ${active ? "bg-white/90 text-black" : "bg-black/40 text-white/90"}
        group-active:scale-95 hover:bg-black/55
      `}>
        {icon}
      </div>
      <span className="text-[11px] font-medium text-white/85 tabular-nums">{label}</span>
    </button>
  );
}

/** Right-side vertical action rail */
function ActionRail({ liked, stats, onLike, onComment, onSave, onRepost }: {
  liked?: boolean;
  stats: { likes: number; comments: number; saves: number; reposts: number; };
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onRepost?: () => void;
}) {
  return (
    <aside
      className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3"
      aria-label="Post actions"
    >
      <RailBtn
        label={format(stats.likes)}
        active={liked}
        onClick={onLike}
        icon={<Heart className="h-5 w-5" fill={liked ? "currentColor" : "none"} />}
      />
      <RailBtn
        label={format(stats.comments)}
        onClick={onComment}
        icon={<MessageCircle className="h-5 w-5" />}
      />
      <RailBtn
        label={format(stats.saves)}
        onClick={onSave}
        icon={<Bookmark className="h-5 w-5" />}
      />
      <RailBtn
        label={format(stats.reposts)}
        onClick={onRepost}
        icon={<Repeat2 className="h-5 w-5" />}
      />
      <RailBtn
        label="Share"
        onClick={() => {
          const url = window.location.href;
          if (navigator.share) navigator.share({ url }).catch(()=>{});
          else { navigator.clipboard.writeText(url).catch(()=>{}); }
        }}
        icon={<Share2 className="h-5 w-5" />}
      />
    </aside>
  );
}
