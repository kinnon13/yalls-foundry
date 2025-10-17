/**
 * Approvals hooks - Infinite pending approvals & mutations
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { logUsageEvent } from '@/lib/telemetry/usageEvents';

type PendingPost = {
  post_id: string;
  post_created_at: string;
  author_user_id: string;
  author_name: string | null;
  author_avatar: string | null;
  body: string;
  media: any;
};

export function usePendingApprovals(entityId: string | null, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['approvals', entityId],
    enabled: !!entityId,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await (supabase.rpc as any)('feed_pending_targets', {
        p_entity_id: entityId,
        p_cursor: pageParam ?? null,
        p_limit: pageSize
      });
      if (error) throw error;
      const items = (data || []) as PendingPost[];
      const nextCursor = items.length === pageSize ? items.at(-1)!.post_created_at : null;
      return { items, nextCursor };
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: null as string | null
  });
}

export const useApproveTarget = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, entityId }: { postId: string; entityId: string }) => {
      const { error } = await (supabase.rpc as any)('post_approve_target', {
        p_post_id: postId,
        p_entity_id: entityId
      });
      if (error) throw error;

      // Log telemetry
      logUsageEvent({
        eventType: 'click',
        itemType: 'post',
        itemId: postId,
        payload: { entity_id: entityId, source: 'dashboard_approvals', action: 'approval_allow' }
      });
    },
    onMutate: async ({ postId, entityId }) => {
      // Log view event
      logUsageEvent({
        eventType: 'impression',
        itemType: 'post',
        itemId: postId,
        payload: { entity_id: entityId, source: 'dashboard_approvals', action: 'approval_view' }
      });

      // Optimistic update: remove from list
      await queryClient.cancelQueries({ queryKey: ['approvals', entityId] });
      const previous = queryClient.getQueryData(['approvals', entityId]);

      queryClient.setQueriesData<any>({ queryKey: ['approvals', entityId] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((item: PendingPost) => item.post_id !== postId)
          }))
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['approvals', variables.entityId], context?.previous);
      toast({ 
        title: 'Error', 
        description: err instanceof Error ? err.message : 'Failed to approve post',
        variant: 'destructive' 
      });
    },
    onSuccess: (_, { entityId }) => {
      toast({ title: 'Post approved' });
      queryClient.invalidateQueries({ queryKey: ['feed-fusion'] });
    }
  });
};

export const useRejectTarget = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      postId, 
      entityId, 
      reason 
    }: { 
      postId: string; 
      entityId: string; 
      reason?: string;
    }) => {
      const { error } = await (supabase.rpc as any)('post_reject_target', {
        p_post_id: postId,
        p_entity_id: entityId,
        p_reason: reason ?? null
      });
      if (error) throw error;

      // Log telemetry
      logUsageEvent({
        eventType: 'click',
        itemType: 'post',
        itemId: postId,
        payload: { entity_id: entityId, reason, source: 'dashboard_approvals', action: 'approval_reject' }
      });
    },
    onMutate: async ({ postId, entityId }) => {
      // Optimistic update: remove from list
      await queryClient.cancelQueries({ queryKey: ['approvals', entityId] });
      const previous = queryClient.getQueryData(['approvals', entityId]);

      queryClient.setQueriesData<any>({ queryKey: ['approvals', entityId] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((item: PendingPost) => item.post_id !== postId)
          }))
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['approvals', variables.entityId], context?.previous);
      toast({ 
        title: 'Error', 
        description: err instanceof Error ? err.message : 'Failed to reject post',
        variant: 'destructive' 
      });
    },
    onSuccess: () => {
      toast({ title: 'Post rejected' });
    }
  });
};
