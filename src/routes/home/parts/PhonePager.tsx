import AppsPane from './AppsPane';
import SocialFeedPane from './SocialFeedPane';
import { User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function PhonePager() {
  const pages = ['apps', 'feed', 'shop', 'profile'] as const;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [endX, setEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
    setEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null || startY === null) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = x - startX;
    const dy = y - startY;
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault(); // lock horizontal swipe to pager
    }
    setEndX(x);
  };
  const handleTouchEnd = () => {
    if (startX === null || endX === null) return;
    const delta = startX - endX;
    const threshold = 50;
    const el = containerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const currentIndex = Math.round(el.scrollLeft / width);
    let next = currentIndex;
    if (delta > threshold) next = Math.min(currentIndex + 1, pages.length - 1);
    if (delta < -threshold) next = Math.max(currentIndex - 1, 0);
    el.scrollTo({ left: next * width, behavior: 'smooth' });
    setStartX(null);
    setEndX(null);
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-screen h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex no-scrollbar touch-pan-x overscroll-none"
      style={{ 
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {pages.map(key => (
        <section 
          key={key} 
          className="snap-center snap-always shrink-0 w-screen h-full overflow-y-auto px-3" 
          aria-label={key}
        >
          {key === 'apps' && <AppsPageMini />}
          {key === 'feed' && <FeedPageMini />}
          {key === 'shop' && <FeedPageMini />}
          {key === 'profile' && <ProfileMini />}
        </section>
      ))}
    </div>
  );
}

function AppsPageMini() {
  return (
    <div className="py-3">
      <AppsPane />
    </div>
  );
}

function FeedPageMini() {
  return (
    <div className="py-3">
      <SocialFeedPane />
    </div>
  );
}

function ProfileMini() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  return (
    <div className="py-3">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>
        <div>
          <div className="font-semibold text-lg">
            {userId ? 'Your Profile' : 'Guest'}
          </div>
          <div className="text-sm text-muted-foreground">
            0 Following · 0 Followers
          </div>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/profile')}
            className="w-full px-4 py-2 rounded-lg border border-border/60 hover:bg-accent/40 transition-colors"
          >
            View Full Profile
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-full px-4 py-2 rounded-lg border border-border/60 hover:bg-accent/40 transition-colors"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}

