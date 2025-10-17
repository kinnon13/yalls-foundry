/**
 * Approvals Module
 * Cross-post approvals + feed moderation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ApprovalsPanel() {
  const { session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending approvals
  const { data: pending, isLoading } = useQuery({
    queryKey: ['approvals', session?.userId],
    queryFn: async () => {
      // Get user's entities
      const { data: entities } = await supabase
        .from('entities')
        .select('id')
        .eq('owner_user_id', session?.userId);
      
      if (!entities?.length) return [];

      const entityIds = entities.map(e => e.id);

      // Get pending post targets
      const { data, error } = await supabase
        .from('post_targets')
        .select(`
          id,
          post_id,
          target_entity_id,
          source_post_id,
          reason,
          created_at,
          posts!inner(body, media, author_user_id)
        `)
        .in('target_entity_id', entityIds)
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.userId,
  });

  const approveMutation = useMutation({
    mutationFn: async (targetId: string) => {
      const { error } = await supabase
        .from('post_targets')
        .update({ approved: true })
        .eq('id', targetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: 'Post approved' });
    },
  });

  const hideMutation = useMutation({
    mutationFn: async ({ postId, entityId }: { postId: string; entityId: string }) => {
      const { error } = await supabase.rpc('feed_hide', {
        p_entity_id: entityId,
        p_post_id: postId,
        p_reason: 'manual_hide',
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: 'Post hidden from feed' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Approvals</h1>
        <p className="text-muted-foreground">
          Review cross-posts and manage your feed
        </p>
      </div>

      {pending && pending.length > 0 ? (
        <div className="space-y-4">
          {pending.map((item: any) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {item.reason === 'repost' ? 'Repost Request' : 'Cross-post Request'}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => approveMutation.mutate(item.id)}
                      disabled={approveMutation.isPending}
                    >
                      <Check size={16} className="mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => hideMutation.mutate({
                        postId: item.post_id,
                        entityId: item.target_entity_id,
                      })}
                      disabled={hideMutation.isPending}
                    >
                      <EyeOff size={16} className="mr-1" />
                      Hide
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">{item.posts.body}</p>
                {item.posts.media && item.posts.media.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {item.posts.media.slice(0, 3).map((m: any, i: number) => (
                      <img
                        key={i}
                        src={m.url}
                        alt=""
                        className="w-16 h-16 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Check className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-lg font-medium mb-1">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No pending approvals at the moment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
