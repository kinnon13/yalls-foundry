/**
 * Home — Unified Feed with Lane Tabs
 * For You (default) / Following / Shop
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { TikTokScroller } from '@/components/reels/TikTokScroller';
import { PublicCalendar } from '@/components/calendar/PublicCalendar';
import { Composer } from '@/components/composer/Composer';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type Lane = 'for_you' | 'following' | 'shop';

interface FusionItem {
  item_type: 'post' | 'listing' | 'event';
  item_id: string;
  score: number;
  created_at: string;
  payload: any;
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useSession();
  const lane = (searchParams.get('lane') || 'for_you') as Lane;

  const setLane = (newLane: Lane) => {
    setSearchParams({ lane: newLane });
  };

  const { data: feedItems = [], isLoading } = useQuery({
    queryKey: ['feed-fusion-home', session?.userId, lane],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('feed_fusion_home', {
        p_user_id: session?.userId || null,
        p_lane: lane,
        p_cursor: null,
        p_limit: 20,
      });
      if (error) throw error;
      return data as FusionItem[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="flex">
        {/* Main Feed */}
        <main className="flex-1 max-w-3xl mx-auto">
          {/* Lane Tabs */}
          <div className="sticky top-16 z-20 bg-background/95 backdrop-blur border-b border-border">
            <div className="flex items-center justify-center gap-8 h-14">
              {(['for_you', 'following', 'shop'] as Lane[]).map((l) => (
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
                  {l === 'for_you' ? 'For You' : l === 'following' ? 'Following' : 'Shop'}
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
          <TikTokScroller items={feedItems} isLoading={isLoading} lane={lane} />
        </main>

        {/* Right Rail - Public Calendar */}
        <aside className="hidden xl:block w-80 border-l border-border sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <PublicCalendar />
        </aside>
      </div>
    </div>
  );
}
