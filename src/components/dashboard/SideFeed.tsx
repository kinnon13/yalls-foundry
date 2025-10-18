/**
 * SideFeed - Fixed right sidecar showing two posts with tab switcher
 */

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrandTotals } from './GrandTotals';
import { FeedPager } from './FeedPager';
import { TwoUpFeed } from './TwoUpFeed';
import { MoreVertical } from 'lucide-react';

type FeedTab = 'following' | 'foryou' | 'shop';

export function SideFeed() {
  const [tab, setTab] = useState<FeedTab>('foryou');
  const tabs: FeedTab[] = ['following', 'foryou', 'shop'];

  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      return data;
    }
  });

  return (
    <aside className="relative h-full flex flex-col rounded-xl border border-border/40 bg-background/60 backdrop-blur overflow-hidden">
      {/* Header: profile + grand totals */}
      <div className="shrink-0 p-3 border-b border-border/30 bg-background/80">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>
              {profile?.display_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {profile?.display_name || 'Your Profile'}
            </div>
            <GrandTotals />
          </div>
          <button className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tab switcher */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as FeedTab)} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-9">
            <TabsTrigger value="following" className="text-xs">Following</TabsTrigger>
            <TabsTrigger value="foryou" className="text-xs">For You</TabsTrigger>
            <TabsTrigger value="shop" className="text-xs">Shop</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pager content */}
      <div className="flex-1 min-h-0">
        <FeedPager tab={tab} tabs={tabs} onTabChange={(t) => setTab(t as FeedTab)}>
          <TwoUpFeed feedKey="following" />
          <TwoUpFeed feedKey="foryou" />
          <TwoUpFeed feedKey="shop" />
        </FeedPager>
      </div>
    </aside>
  );
}
