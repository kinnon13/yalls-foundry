/**
 * Approvals Page - Pending cross-posts and hidden posts management
 * <200 LOC
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ApprovalsPage() {
  const { toast } = useToast();

  // Get user's owned entities
  const { data: entities } = useQuery({
    queryKey: ['owned-entities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('entities')
        .select('id, display_name, handle')
        .eq('owner_user_id', user.id);

      if (error) throw error;
      return data;
    },
  });

  // Get pending targets across all entities
  const { data: pending, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['pending-targets', entities?.map(e => e.id)],
    queryFn: async () => {
      if (!entities || entities.length === 0) return [];

      const results = await Promise.all(
        entities.map(async (entity) => {
          const { data, error } = await supabase.rpc('feed_pending_targets', {
            p_entity_id: entity.id,
          });

          if (error) throw error;

          return data?.map((row: any) => ({
            ...row,
            entity_name: entity.display_name,
            entity_id: entity.id,
          })) || [];
        })
      );

      return results.flat();
    },
    enabled: !!entities && entities.length > 0,
  });

  // Get hidden posts across entities
  const { data: hidden, isLoading: hiddenLoading, refetch: refetchHidden } = useQuery({
    queryKey: ['hidden-posts', entities?.map(e => e.id)],
    queryFn: async () => {
      if (!entities || entities.length === 0) return [];

      const { data, error } = await supabase
        .from('feed_hides')
        .select('*, posts(*), entities(display_name)')
        .in('entity_id', entities.map(e => e.id));

      if (error) throw error;
      return data;
    },
    enabled: !!entities && entities.length > 0,
  });

  const handleApprove = async (postId: string, entityId: string) => {
    const { error } = await supabase.rpc('post_target_approve', {
      p_post_id: postId,
      p_entity_id: entityId,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post approved' });
      refetchPending();
    }
  };

  const handleReject = async (postId: string, entityId: string) => {
    const { error } = await supabase.rpc('post_target_reject', {
      p_post_id: postId,
      p_entity_id: entityId,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post rejected' });
      refetchPending();
    }
  };

  const handleUnhide = async (postId: string, entityId: string) => {
    const { error } = await supabase.rpc('feed_unhide', {
      p_post_id: postId,
      p_entity_id: entityId,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post restored' });
      refetchHidden();
    }
  };

  if (!entities || entities.length === 0) {
    return (
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-6">Approvals</h1>
        <p className="text-muted-foreground">You don't own any entities yet.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Approvals</h1>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending {pending && pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="hidden">
            Hidden {hidden && hidden.length > 0 && `(${hidden.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingLoading && <Loader2 className="h-6 w-6 animate-spin" />}
          {pending && pending.length === 0 && (
            <p className="text-muted-foreground">No pending approvals.</p>
          )}
          {pending?.map((item: any) => (
            <Card key={`${item.post_id}-${item.entity_id}`} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Badge variant="secondary" className="mb-2">
                    {item.entity_name}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Cross-post requested {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(item.post_id, item.entity_id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(item.post_id, item.entity_id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="hidden" className="space-y-4">
          {hiddenLoading && <Loader2 className="h-6 w-6 animate-spin" />}
          {hidden && hidden.length === 0 && (
            <p className="text-muted-foreground">No hidden posts.</p>
          )}
          {hidden?.map((item: any) => (
            <Card key={`${item.post_id}-${item.entity_id}`} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Badge variant="secondary" className="mb-2">
                    {item.entities?.display_name}
                  </Badge>
                  <p className="text-sm">{item.posts?.body?.substring(0, 100)}...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hidden {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnhide(item.post_id, item.entity_id)}
                >
                  Unhide
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
