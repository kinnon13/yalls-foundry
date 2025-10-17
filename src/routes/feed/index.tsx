/**
 * Feed Page - Personal vs Combined toggle
 * <200 LOC
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { FeedComposer } from '@/components/feed/FeedComposer';
import { PostCard } from '@/components/feed/PostCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function FeedPage() {
  const [view, setView] = useState<'personal' | 'combined'>('personal');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ['feed', view, user?.id],
    queryFn: async () => {
      if (!user) return [];

      if (view === 'personal') {
        // Personal: only posts targeting user's owned entities
        const { data: ownedEntities } = await supabase
          .from('entities')
          .select('id')
          .eq('owner_user_id', user.id);

        const entityIds = ownedEntities?.map(e => e.id) || [];

        if (entityIds.length === 0) return [];

        const { data, error } = await supabase
          .from('post_targets')
          .select(`
            *,
            posts (
              id,
              body,
              media,
              created_at,
              author_user_id,
              profiles (display_name, avatar_url),
              entities (id, display_name, handle)
            )
          `)
          .in('target_entity_id', entityIds)
          .eq('approved', true)
          .not('posts.id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return data || [];
      } else {
        // Combined: all posts from followed entities + own entities
        const { data, error } = await supabase
          .from('post_targets')
          .select(`
            *,
            posts (
              id,
              body,
              media,
              created_at,
              author_user_id,
              profiles (display_name, avatar_url),
              entities (id, display_name, handle)
            )
          `)
          .eq('approved', true)
          .not('posts.id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        return data || [];
      }
    },
    enabled: !!user
  });

  const { data: ownedEntities } = useQuery({
    queryKey: ['owned-entities', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('entities')
        .select('id, display_name, handle')
        .eq('owner_user_id', user.id);
      return data || [];
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="personal" className="flex-1">Personal</TabsTrigger>
            <TabsTrigger value="combined" className="flex-1">Combined</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <FeedComposer onPostCreated={refetch} authorEntities={ownedEntities || []} />
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 mt-6">
                {posts?.map((target: any) => (
                  <PostCard key={target.id} target={target} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="combined">
            <FeedComposer onPostCreated={refetch} authorEntities={ownedEntities || []} />
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 mt-6">
                {posts?.map((target: any) => (
                  <PostCard key={target.id} target={target} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
