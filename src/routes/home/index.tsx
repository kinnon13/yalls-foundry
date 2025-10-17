/**
 * Home — Unified Feed with Lane Tabs + Infinite Scroll
 * For You (default) / Following / Shop
 */

import { useSearchParams } from 'react-router-dom';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { TikTokScroller } from '@/components/feed/TikTokScroller';
import { PublicCalendar } from '@/components/calendar/PublicCalendar';
import { Composer } from '@/components/composer/Composer';
import { useSession } from '@/lib/auth/context';
import { useScrollerFeed } from '@/hooks/useScrollerFeed';
import { Finder } from '@/components/overlays/Finder';
import { NotificationBell } from '@/components/overlays/NotificationBell';

type Lane = 'personal' | 'combined';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useSession();
  const laneParam = searchParams.get('lane') || 'personal';
  const lane = (laneParam === 'following' ? 'combined' : 'personal') as Lane;

  const setLane = (newLane: Lane) => {
    setSearchParams({ lane: newLane });
  };

  // Fetch feed with infinite scroll
  const feed = useScrollerFeed({ lane });

  // Flatten all pages
  const feedItems = feed.data?.pages.flatMap(page => page.items) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="flex">
        {/* Main Feed */}
        <main className="flex-1 max-w-3xl mx-auto">
          {/* Lane Tabs */}
          <div className="sticky top-16 z-20 bg-background/95 backdrop-blur border-b border-border">
            <div className="flex items-center justify-center gap-8 h-14">
              {(['personal', 'combined'] as Lane[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLane(l)}
                  className={`
                    relative px-4 py-2 text-sm font-medium transition-all
                    ${lane === l 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {l === 'personal' ? 'Personal' : 'Combined'}
                  {lane === l && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-scale-in" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Composer */}
          {session && (
            <div className="border-b border-border">
              <Composer />
            </div>
          )}

          {/* Scroller */}
          <TikTokScroller
            items={feedItems}
            isLoading={feed.isLoading || feed.isFetchingNextPage}
            onLoadMore={() => feed.fetchNextPage()}
            hasNextPage={feed.hasNextPage}
            lane={lane}
          />
        </main>

        {/* Right Rail - Public Calendar */}
        <aside className="hidden xl:block w-80 border-l border-border sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <PublicCalendar />
        </aside>
      </div>

      {/* Global Overlays */}
      <Finder />
    </div>
  );
}
