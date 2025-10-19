/**
 * Feed Pane - TikTok-style vertical reels
 * Right-side feed with 9:16 aspect ratio, keyboard nav
 */

import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface Reel {
  id: string;
  imageUrl: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
}

const MOCK_REELS: Reel[] = [
  {
    id: 'r1',
    imageUrl: '/placeholder.svg',
    title: 'Spring Horse Show 🐴',
    author: '@BlueCreekFarm',
    likes: 2847,
    comments: 183,
  },
  {
    id: 'r2',
    imageUrl: '/placeholder.svg',
    title: 'Foal Friday Cuteness',
    author: '@SunsetStables',
    likes: 5621,
    comments: 412,
  },
  {
    id: 'r3',
    imageUrl: '/placeholder.svg',
    title: 'Western Tack Sale 🤠',
    author: '@GraysonEquip',
    likes: 1234,
    comments: 89,
  },
];

export function FeedPane() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(prev + 1, MOCK_REELS.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const reel = MOCK_REELS[currentIndex];

  return (
    <section className="feed card">
      <div className="reel">
        <img 
          src={reel.imageUrl} 
          alt={reel.title} 
          className="reel-media"
        />
        
        {/* Action buttons - right side */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-6">
          <ActionButton icon={Heart} count={reel.likes} />
          <ActionButton icon={MessageCircle} count={reel.comments} />
          <ActionButton icon={Share2} />
          <ActionButton icon={Bookmark} />
        </div>

        {/* Caption overlay - bottom */}
        <div className="reel-meta">
          <div className="reel-title">{reel.title}</div>
          <div className="reel-author">{reel.author}</div>
        </div>
      </div>

      <div className="feed-hint">
        ↑/↓ to navigate · {currentIndex + 1} of {MOCK_REELS.length}
      </div>
    </section>
  );
}

function ActionButton({ icon: Icon, count }: { icon: any; count?: number }) {
  return (
    <button
      className="flex flex-col items-center gap-1 text-white transition-all hover:scale-110"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        padding: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Icon className="h-6 w-6" strokeWidth={2.5} />
      {count !== undefined && (
        <span className="text-xs font-semibold">
          {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </button>
  );
}
