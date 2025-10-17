/**
 * Discover - For You / Trending / Latest with TikTok scroller
 */

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScrollerFeed } from '@/hooks/useScrollerFeed';
import { TikTokScroller } from '@/components/feed/TikTokScroller';
import { Finder } from '@/components/overlays/Finder';
import { NotificationBell } from '@/components/overlays/NotificationBell';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';

type DiscoverMode = 'for_you' | 'trending' | 'latest';

export default function DiscoverPage() {
  const [mode, setMode] = useState<DiscoverMode>('for_you');
  
  const feed = useScrollerFeed({ lane: 'combined' });
  const allItems = feed.data?.pages.flatMap(page => page.items) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold">Discover</h1>
          
          <div className="flex items-center gap-4">
            <Tabs value={mode} onValueChange={(v) => setMode(v as DiscoverMode)}>
              <TabsList>
                <TabsTrigger value="for_you" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  For You
                </TabsTrigger>
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="latest" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Latest
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="pt-14">
        <TikTokScroller
          items={allItems}
          onLoadMore={() => feed.fetchNextPage()}
          hasMore={feed.hasNextPage}
          isLoading={feed.isFetchingNextPage}
        />
      </main>

      <Finder />
    </div>
  );
}
