/**
 * useNotifications Hook
 * React hooks for notification operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth/context';
import { notificationsAdapter } from '@/lib/adapters/notifications';
import type { NotificationLane } from '@/lib/adapters/notifications-types';
import { toast } from 'sonner';

export function useNotifications(lane: NotificationLane) {
  const { session } = useSession();
  const userId = session?.userId || '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', userId, lane],
    queryFn: () => notificationsAdapter.listNotifications(userId, lane),
    enabled: !!userId,
    staleTime: 30000 // 30s
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationIds: string[]) => 
      notificationsAdapter.markRead(userId, notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId, lane] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', userId] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsAdapter.markAllRead(userId, lane),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId, lane] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', userId] });
      toast.success(`All ${lane} notifications marked as read`);
    }
  });

  const unreadCount = query.data?.filter(n => !n.read_at).length || 0;

  return {
    notifications: query.data || [],
    unreadCount,
    isLoading: query.isLoading,
    error: query.error,
    markRead: markReadMutation,
    markAllRead: markAllReadMutation,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
    refetch: query.refetch
  };
}

export function useNotificationCounts() {
  const { session } = useSession();
  const userId = session?.userId || '';

  const query = useQuery({
    queryKey: ['notification-counts', userId],
    queryFn: () => notificationsAdapter.getCounts(userId),
    enabled: !!userId,
    staleTime: 10000, // 10s
    refetchInterval: 30000 // Poll every 30s
  });

  return {
    counts: query.data || { priority: 0, social: 0, system: 0 },
    isLoading: query.isLoading
  };
}

export function useNotificationTest() {
  const { session } = useSession();
  const userId = session?.userId || '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kind: string) => notificationsAdapter.enqueueTest(userId, kind),
    onSuccess: (_, kind) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', userId] });
      toast.success(`Test ${kind} notification created`);
    }
  });
}
