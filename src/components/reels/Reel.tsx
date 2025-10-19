import { useState } from 'react';
import { Heart, MessageCircle, Bookmark, Repeat2, Share2, Plus, Music } from 'lucide-react';

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
      className="relative w-full h-full bg-black rounded-none overflow-hidden flex items-center justify-center"
      onDoubleClick={doubleTapLike}
    >
      {/* MEDIA: full-bleed, 9:16 aspect ratio */}
      <img
        src={src}
        alt={alt || ''}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover select-none"
        style={{ aspectRatio: '9/16' }}
      />

      {/* HEART BURST on double-tap */}
      {heartBurst && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Heart className="h-24 w-24 text-white/90 animate-ping" fill="currentColor" />
        </div>
      )}

      {/* BOTTOM GRADIENT + CAPTION */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
      {caption && (
        <p className="absolute bottom-20 left-3 right-16 text-white/90 text-sm leading-snug line-clamp-2">
          {caption}
        </p>
      )}

      {/* ACTION RAIL - premium TikTok style */}
      <ActionRail
        author={author}
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
        grid place-items-center h-10 w-10 rounded-full backdrop-blur-md transition-transform
        ${active ? 'bg-white/70 text-black' : 'bg-black/20 text-white'}
        group-active:scale-95 hover:bg-black/30
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
  author,
  liked,
  stats,
  onLike,
  onComment,
  onSave,
  onRepost,
}: {
  author: { name: string; handle?: string; avatar?: string };
  liked?: boolean;
  stats: { likes: number; comments: number; saves: number; reposts: number };
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onRepost?: () => void;
}) {
  return (
    <aside className="absolute right-2 bottom-2 flex flex-col gap-2.5 items-center" aria-label="Post actions">
      {/* Creator Profile with Plus Button */}
      <div className="relative">
        <button 
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-full"
          aria-label={`View ${author.name}'s profile`}
        >
          {author.avatar ? (
            <img 
              src={author.avatar} 
              alt={author.name} 
              className="h-10 w-10 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-white/20 border-2 border-white/20" />
          )}
        </button>
        {/* Plus button overlay */}
        <button
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 grid place-items-center transition-colors"
          aria-label="Follow"
        >
          <Plus className="h-3 w-3 text-white" strokeWidth={3} />
        </button>
      </div>

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
      
      {/* Spinning Sound/Music Disc */}
      <button
        className="relative h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 grid place-items-center animate-spin-slow hover:animate-none transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        aria-label="View sound"
      >
        <Music className="h-4 w-4 text-white" />
      </button>
    </aside>
  );
}
