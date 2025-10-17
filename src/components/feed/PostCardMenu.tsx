/**
 * Post Card Menu - Moderation actions (hide/unhide, approve/reject)
 * <100 LOC
 */

import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logUsageEvent } from '@/lib/telemetry/usageEvents';

type PostCardMenuProps = {
  postId: string;
  entityId: string;
  isHidden?: boolean;
  isPending?: boolean;
  canModerate: boolean;
};

export function PostCardMenu({
  postId,
  entityId,
  isHidden = false,
  isPending = false,
  canModerate,
}: PostCardMenuProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!canModerate) return null;

  const hideMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('feed_hide', {
        p_post_id: postId,
        p_entity_id: entityId,
      });
      if (error) throw error;
      
      logUsageEvent({
        eventType: 'click',
        itemType: 'post',
        itemId: postId,
        payload: { entity_id: entityId, source: 'post_card_menu', action: 'hide_post' }
      });
    },
    onMutate: async () => {
      // Optimistic update: remove from feed
      await queryClient.cancelQueries({ queryKey: ['feed-fusion'] });
      
      queryClient.setQueriesData<any>({ queryKey: ['feed-fusion'] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((item: any) => item.id !== postId)
          }))
        };
      });
    },
    onSuccess: () => {
      toast({ title: 'Post hidden from this page' });
      queryClient.invalidateQueries({ queryKey: ['feed-fusion'] });
    },
    onError: (err) => {
      toast({ 
        title: 'Error', 
        description: err instanceof Error ? err.message : 'Failed to hide post',
        variant: 'destructive' 
      });
      queryClient.invalidateQueries({ queryKey: ['feed-fusion'] });
    }
  });

  const handleUnhide = async () => {
    const { error } = await supabase.rpc('feed_unhide', {
      p_post_id: postId,
      p_entity_id: entityId,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post restored' });
      window.location.reload();
    }
  };

  const handleApprove = async () => {
    const { error } = await supabase.rpc('post_target_approve', {
      p_post_id: postId,
      p_entity_id: entityId,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post approved' });
      window.location.reload();
    }
  };

  const handleReject = async () => {
    const { error } = await supabase.rpc('post_target_reject', {
      p_post_id: postId,
      p_entity_id: entityId,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post rejected' });
      window.location.reload();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isPending && (
          <>
            <DropdownMenuItem onClick={handleApprove}>
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReject}>
              Reject
            </DropdownMenuItem>
          </>
        )}
        {!isPending && (
          <>
            {isHidden ? (
              <DropdownMenuItem onClick={handleUnhide}>
                Unhide from this page
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={() => hideMutation.mutate()}
                disabled={hideMutation.isPending}
              >
                Hide from this page
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
