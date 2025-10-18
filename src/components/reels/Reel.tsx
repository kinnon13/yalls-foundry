import { useState } from 'react';
import { Heart, MessageCircle, Bookmark, Repeat2, Share2 } from 'lucide-react';

interface ReelProps {
  src: string;
  alt?: string;
  author: {
    name: string;
    handle?: string;
    avatar?: string;
  };
  caption?: string;
  stats: {
    likes: number;
    comments: number;
    saves: number;
    reposts: number;
  };
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onRepost?: () => void;
}

export function Reel({ src, alt, author, caption, stats, onLike, onComment, onSave, onRepost }: ReelProps) {
  const [liked, setLiked] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);

  const doubleTapLike = () => {
    setLiked(true);
    onLike?.();
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 420);
  };

  return (
    <article
      className="relative w-full h-full snap-start bg-black overflow-hidden"
      onDoubleClick={doubleTapLike}
    >
      {/* MEDIA: full-bleed */}
      <img
        src={src}
        alt={alt || ''}
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
        {author.avatar ? (
          <img src={author.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-white/20" />
        )}
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
        stats={stats}
        onLike={() => {
          setLiked(v => !v);
          onLike?.();
        }}
        onComment={onComment}
        onSave={onSave}
        onRepost={onRepost}
      />
    </article>
  );
}

/** Format numbers (1.2k, 3.4m) */
function format(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

/** Action rail button component */
function RailBtn({
  label,
  icon,
  active,
  onClick,
}: {
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
      <div
        className={`
        grid place-items-center h-12 w-12 rounded-2xl backdrop-blur-md transition-transform
        ${active ? 'bg-white/90 text-black' : 'bg-black/40 text-white/90'}
        group-active:scale-95 hover:bg-black/55
      `}
      >
        {icon}
      </div>
      <span className="text-[11px] font-medium text-white/85 tabular-nums">{label}</span>
    </button>
  );
}

/** Right-side vertical action rail */
function ActionRail({
  liked,
  stats,
  onLike,
  onComment,
  onSave,
  onRepost,
}: {
  liked?: boolean;
  stats: { likes: number; comments: number; saves: number; reposts: number };
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onRepost?: () => void;
}) {
  return (
    <aside className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3" aria-label="Post actions">
      <RailBtn
        label={format(stats.likes)}
        active={liked}
        onClick={onLike}
        icon={<Heart className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />}
      />
      <RailBtn
        label={format(stats.comments)}
        onClick={onComment}
        icon={<MessageCircle className="h-5 w-5" />}
      />
      <RailBtn label={format(stats.saves)} onClick={onSave} icon={<Bookmark className="h-5 w-5" />} />
      <RailBtn label={format(stats.reposts)} onClick={onRepost} icon={<Repeat2 className="h-5 w-5" />} />
      <RailBtn
        label="Share"
        onClick={() => {
          const url = window.location.href;
          if (navigator.share) navigator.share({ url }).catch(() => {});
          else {
            navigator.clipboard.writeText(url).catch(() => {});
          }
        }}
        icon={<Share2 className="h-5 w-5" />}
      />
    </aside>
  );
}
