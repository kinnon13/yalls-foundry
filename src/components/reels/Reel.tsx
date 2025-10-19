import { useState } from 'react';
import { Heart, MessageCircle, Bookmark, Repeat2, Share2, Plus, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

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
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const { toast } = useToast();
  const { session } = useSession();

  const doubleTapLike = () => {
    if (!liked) {
      setLiked(true);
      onLike?.();
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 420);
    }
  };

  const handleFollow = async () => {
    if (!session?.userId) {
      toast({ title: 'Sign in required', description: 'Please sign in to follow creators' });
      return;
    }
    setFollowing(!following);
    toast({ 
      title: following ? 'Unfollowed' : 'Following!',
      description: `You ${following ? 'unfollowed' : 'are now following'} ${author.name}`
    });
  };

  const handleComment = () => {
    if (!session?.userId) {
      toast({ title: 'Sign in required', description: 'Please sign in to comment' });
      return;
    }
    toast({ title: 'Comments', description: 'Comment feature coming soon!' });
  };

  const handleSave = async () => {
    if (!session?.userId) {
      toast({ title: 'Sign in required', description: 'Please sign in to save posts' });
      return;
    }
    setSaved(!saved);
    onSave?.();
    toast({ 
      title: saved ? 'Removed from saved' : 'Saved!',
      description: saved ? 'Post removed from your collection' : 'Post added to your collection'
    });
  };

  const handleRepost = () => {
    if (!session?.userId) {
      toast({ title: 'Sign in required', description: 'Please sign in to repost' });
      return;
    }
    onRepost?.();
    toast({ title: 'Reposted!', description: 'Post shared to your profile' });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: caption || 'Check this out!' });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast({ title: 'Link copied!', description: 'Share link copied to clipboard' });
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!', description: 'Share link copied to clipboard' });
    }
  };

  const handleViewProfile = () => {
    toast({ title: `${author.name}`, description: `@${author.handle || 'user'}` });
  };

  const handleViewSound = () => {
    toast({ title: 'Original Sound', description: `View all videos with this sound` });
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
        saved={saved}
        following={following}
        stats={stats}
        onLike={() => {
          setLiked(v => !v);
          onLike?.();
        }}
        onFollow={handleFollow}
        onComment={handleComment}
        onSave={handleSave}
        onRepost={handleRepost}
        onShare={handleShare}
        onViewProfile={handleViewProfile}
        onViewSound={handleViewSound}
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
  saved,
  following,
  stats,
  onLike,
  onFollow,
  onComment,
  onSave,
  onRepost,
  onShare,
  onViewProfile,
  onViewSound,
}: {
  author: { name: string; handle?: string; avatar?: string };
  liked?: boolean;
  saved?: boolean;
  following?: boolean;
  stats: { likes: number; comments: number; saves: number; reposts: number };
  onLike?: () => void;
  onFollow?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onRepost?: () => void;
  onShare?: () => void;
  onViewProfile?: () => void;
  onViewSound?: () => void;
}) {
  return (
    <aside className="absolute right-2 bottom-2 flex flex-col gap-2.5 items-center" aria-label="Post actions">
      {/* Creator Profile with Plus Button */}
      <div className="relative">
        <button 
          onClick={onViewProfile}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-full transition-transform hover:scale-105"
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
        {!following && (
          <button
            onClick={onFollow}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 grid place-items-center transition-all hover:scale-110 active:scale-95"
            aria-label="Follow"
          >
            <Plus className="h-3 w-3 text-white" strokeWidth={3} />
          </button>
        )}
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
      <RailBtn 
        label={format(stats.saves)} 
        active={saved}
        onClick={onSave} 
        icon={<Bookmark className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />} 
      />
      <RailBtn label={format(stats.reposts)} onClick={onRepost} icon={<Repeat2 className="h-5 w-5" />} />
      <RailBtn
        label="Share"
        onClick={onShare}
        icon={<Share2 className="h-5 w-5" />}
      />
      
      {/* Spinning Sound/Music Disc */}
      <button
        onClick={onViewSound}
        className="relative h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 grid place-items-center animate-spin-slow hover:animate-none transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 hover:scale-110 active:scale-95"
        aria-label="View sound"
      >
        <Music className="h-4 w-4 text-white" />
      </button>
    </aside>
  );
}
