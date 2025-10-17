/**
 * useNotifications Hook
 * React hooks for notification operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { notificationsAdapter } from '@/lib/adapters/notifications';
import type { NotificationLane } from '@/lib/adapters/notifications-types';
import { toast } from 'sonner';

export function useNotifications(lane: NotificationLane) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id, lane],
    queryFn: () => notificationsAdapter.listNotifications(user!.id, lane),
    enabled: !!user,
    staleTime: 30000 // 30s
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationIds: string[]) => 
      notificationsAdapter.markRead(user!.id, notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id, lane] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', user?.id] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsAdapter.markAllRead(user!.id, lane),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id, lane] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', user?.id] });
      toast.success(`All ${lane} notifications marked as read`);
    }
  });

  return {
    notifications: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
    refetch: query.refetch
  };
}

export function useNotificationCounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-counts', user?.id],
    queryFn: () => notificationsAdapter.getCounts(user!.id),
    enabled: !!user,
    staleTime: 10000, // 10s
    refetchInterval: 30000 // Poll every 30s
  });
}

export function useNotificationTest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kind: string) => notificationsAdapter.enqueueTest(user!.id, kind),
    onSuccess: (_, kind) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', user?.id] });
      toast.success(`Test ${kind} notification created`);
    }
  });
}
