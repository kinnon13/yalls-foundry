/**
 * Social Shell - Hybrid Deck + Bubbles Layout
 * 
 * Top: Horizontal bubble rail (people, businesses, horses, apps)
 * Main: Vertical feed scroller
 * Left/Right: Switch profile context
 * Up/Down: Scroll feed
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { BubbleRail } from '@/components/social/BubbleRail';
import { ProfileDeck } from '@/components/social/ProfileDeck';
import { Loader2 } from 'lucide-react';

export interface BubbleItem {
  id: string;
  type: 'person' | 'business' | 'horse' | 'app';
  display_name: string;
  handle?: string;
  avatar_url?: string;
  ring_color: string;
  badge?: string;
  metadata?: any;
}

export default function SocialPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const targetId = searchParams.get('target');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch pinned + frequently interacted bubbles
  const { data: bubbles, isLoading } = useQuery({
    queryKey: ['social-bubbles', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get pinned entities
      const { data: pins } = await supabase
        .from('user_pins')
        .select('ref_id, pin_type, metadata')
        .eq('user_id', userId)
        .in('pin_type', ['entity'])
        .order('sort_index');

      const entityIds = pins?.map(p => p.ref_id) || [];

      if (entityIds.length === 0) {
        // Fallback: show some suggested entities
        const { data: suggested } = await supabase
          .from('entities')
          .select('id, display_name, handle, kind, status, metadata')
          .limit(10);

        return (suggested || []).map(e => ({
          id: e.id,
          type: (e.kind === 'person' ? 'person' : e.kind === 'horse' ? 'horse' : 'business') as 'person' | 'business' | 'horse' | 'app',
          display_name: e.display_name,
          handle: e.handle || undefined,
          avatar_url: (e.metadata as any)?.avatar_url || (e.metadata as any)?.logo_url,
          ring_color: e.kind === 'person' ? 'hsl(258 85% 60%)' : e.kind === 'horse' ? 'hsl(160 65% 50%)' : 'hsl(200 90% 55%)',
          badge: e.status === 'unclaimed' ? 'Unclaimed' : undefined,
        }));
      }

      // Chunk large IN queries
      const chunk = <T,>(arr: T[], n = 100): T[][] => 
        Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => 
          arr.slice(i * n, (i + 1) * n)
        );

      const results = await Promise.all(
        chunk(entityIds, 100).map(ids =>
          supabase
            .from('entities')
            .select('id, display_name, handle, kind, status, metadata')
            .in('id', ids)
        )
      );

      const entities = results.flatMap(r => r.data ?? []);

      return entities.map(e => ({
        id: e.id,
        type: (e.kind === 'person' ? 'person' : e.kind === 'horse' ? 'horse' : 'business') as 'person' | 'business' | 'horse' | 'app',
        display_name: e.display_name,
        handle: e.handle || undefined,
        avatar_url: (e.metadata as any)?.avatar_url || (e.metadata as any)?.logo_url,
        ring_color: e.kind === 'person' ? 'hsl(258 85% 60%)' : e.kind === 'horse' ? 'hsl(160 65% 50%)' : 'hsl(200 90% 55%)',
        badge: e.status === 'unclaimed' ? 'Unclaimed' : undefined,
      }));
    },
    enabled: !!userId
  });

  const activeId = targetId || bubbles?.[0]?.id;

  const handleBubbleChange = (id: string) => {
    setSearchParams({ target: id });
  };

  if (isLoading || !bubbles) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <GlobalHeader />
      
      <div className="relative">
        {/* Top Bubble Rail */}
        <BubbleRail
          items={bubbles}
          activeId={activeId || ''}
          onChange={handleBubbleChange}
        />

        {/* Main Deck */}
        {activeId && (
          <ProfileDeck
            currentId={activeId}
            allBubbles={bubbles}
            onSwitch={handleBubbleChange}
          />
        )}
      </div>
    </div>
  );
}
