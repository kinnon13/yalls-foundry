/**
 * Notifications Hook
 * Real-time bell notifications with unread count
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { useEffect } from 'react';
import type { Notification } from '@/types/domain';

export function useNotifications() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', session?.userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', session?.userId!)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!session?.userId,
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markRead = useMutation({
    mutationFn: async (notifId: string) => {
      const { error } = await (supabase as any).rpc('notif_mark_read', {
        p_notif_id: notifId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc('notif_mark_all_read');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!session?.userId) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session?.userId, queryClient]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
  };
}
