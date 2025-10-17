/**
 * Notification Preferences Hook
 * Get/update user preferences with optimistic UI
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationPrefs } from '@/ports';
import type { UserNotifPrefs } from '@/ports/notifications';
import { toast } from 'sonner';

export function useNotificationPrefs(userId: string) {
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notification-prefs', userId],
    queryFn: () => NotificationPrefs.get(userId),
    staleTime: 60_000,
    enabled: !!userId,
  });

  const update = useMutation({
    mutationFn: (patch: Partial<UserNotifPrefs>) => NotificationPrefs.update(userId, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ['notification-prefs', userId] });
      const prev = queryClient.getQueryData<UserNotifPrefs>(['notification-prefs', userId]);
      
      if (prev) {
        queryClient.setQueryData<UserNotifPrefs>(['notification-prefs', userId], {
          ...prev,
          ...patch,
        });
      }
      
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['notification-prefs', userId], ctx.prev);
      }
      toast.error('Failed to update preferences');
    },
    onSuccess: () => {
      toast.success('Preferences saved');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs', userId] });
    },
  });

  const digestPreview = useQuery({
    queryKey: ['notification-digest-preview', userId],
    queryFn: () => NotificationPrefs.digestPreview(userId),
    enabled: false, // Manual trigger only
  });

  const sendTestDigest = useMutation({
    mutationFn: () => NotificationPrefs.sendTestDigest(userId),
    onSuccess: () => {
      toast.success('Test digest sent!');
    },
    onError: () => {
      toast.error('Failed to send test digest');
    },
  });

  return {
    prefs,
    isLoading,
    update,
    digestPreview,
    sendTestDigest,
  };
}
