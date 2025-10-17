/**
 * Notifications Hook
 * Paginated list with optimistic mark-read
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Notifications } from '@/ports';
import type { NotificationLane, NotificationItem } from '@/ports/notifications';

export function useNotifications(userId: string, lane: NotificationLane) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId, lane],
    queryFn: () => Notifications.list(userId, lane, { limit: 50 }),
    staleTime: 30_000,
    enabled: !!userId,
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const markRead = useMutation({
    mutationFn: (ids: string[]) => Notifications.markRead(userId, ids),
    onMutate: async (ids) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications', userId, lane] });
      const prev = queryClient.getQueryData<NotificationItem[]>(['notifications', userId, lane]);
      
      queryClient.setQueryData<NotificationItem[]>(['notifications', userId, lane], (old = []) =>
        old.map(n => ids.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n)
      );
      
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['notifications', userId, lane], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId, lane] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', userId] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => Notifications.markAllRead(userId, lane),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId, lane] });
      const prev = queryClient.getQueryData<NotificationItem[]>(['notifications', userId, lane]);
      
      queryClient.setQueryData<NotificationItem[]>(['notifications', userId, lane], (old = []) =>
        old.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['notifications', userId, lane], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId, lane] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts', userId] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
  };
}
