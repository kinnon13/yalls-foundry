import { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Bookmark, Repeat2, Share2 } from 'lucide-react';

// TEMP data – wire to real feed later
const items = new Array(20).fill(0).map((_, i) => ({
  id: `post-${i}`,
  img: `https://picsum.photos/seed/reel-${i}/900/1600`,
  caption: `Post #${i + 1}`,
  likes: Math.floor(Math.random() * 1000),
  comments: Math.floor(Math.random() * 200),
}));

export default function SocialFeedPane() {
  const paneRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [reelSize, setReelSize] = useState({ w: 360, h: 640 }); // 9:16 default
  const [tab, setTab] = useState<'following'|'for-you'|'shop'>('following');

  // Fit a 9:16 box to the pane: w = min(paneW, paneH * 9/16), h = w * 16/9
  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;

    const resize = () => {
      const paneW = el.clientWidth;
      const paneH = el.clientHeight;
      const headerH = headerRef.current?.offsetHeight ?? 0;
      const availH = Math.max(0, paneH - headerH - 8); // subtract sticky header + a small gap
      const wFromH = Math.floor((availH * 9) / 16);
      const w = Math.min(paneW, wFromH);
      const h = Math.floor((w * 16) / 9);
      setReelSize({ w, h });
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    // Also observe header height changes
    let roHeader: ResizeObserver | null = null;
    if (headerRef.current) {
      roHeader = new ResizeObserver(resize);
      roHeader.observe(headerRef.current);
    }
    resize();
    return () => { ro.disconnect(); roHeader?.disconnect(); };
  }, []);

  return (
    <div ref={paneRef} className="h-full w-full overflow-y-auto overscroll-contain">
      {/* Profile bubble + totals + tabs */}
      <div ref={headerRef} className="sticky top-0 z-10 bg-background/85 backdrop-blur px-3 py-2 border-b border-border/40">
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

      {/* Feed with auto-sized reels */}
      <div className="w-full flex flex-col items-center gap-6 py-3">
        {items.map(card => (
          <article
            key={card.id}
            className="relative overflow-hidden shadow-lg"
            style={{ width: reelSize.w, height: reelSize.h }}
          >
            {/* Media fills fully */}
            <img
              src={card.img}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />

            {/* Right-side action stack (kept inside the box) */}
            <div className="absolute right-2 bottom-20 flex flex-col gap-3 text-white/95">
              <IconBtn label="Like" count={card.likes}>
                <Heart className="w-5 h-5" />
              </IconBtn>
              <IconBtn label="Comment" count={card.comments}>
                <MessageCircle className="w-5 h-5" />
              </IconBtn>
              <IconBtn label="Save">
                <Bookmark className="w-5 h-5" />
              </IconBtn>
              <IconBtn label="Repost">
                <Repeat2 className="w-5 h-5" />
              </IconBtn>
              <IconBtn label="Share">
                <Share2 className="w-5 h-5" />
              </IconBtn>
            </div>

            {/* Caption gradient + text */}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="relative z-10 text-white/95 text-sm">{card.caption}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function IconBtn({ children, label, count }: { children: React.ReactNode; label: string; count?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        aria-label={label}
        title={label}
        className="grid place-items-center size-10 rounded-full bg-black/35 backdrop-blur
                   hover:bg-black/50 border border-white/20 transition-colors"
      >
        {children}
      </button>
      {count !== undefined && (
        <span className="text-xs font-medium">{count > 999 ? `${(count/1000).toFixed(1)}K` : count}</span>
      )}
    </div>
  );
}
