/**
 * useNotificationPrefs Hook
 * React hooks for notification preferences
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth/context';
import { notificationsAdapter } from '@/lib/adapters/notifications';
import type { NotificationPrefs } from '@/lib/adapters/notifications-types';
import { toast } from 'sonner';

export function useNotificationPrefs() {
  const { session } = useSession();
  const userId = session?.userId || '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-prefs', userId],
    queryFn: () => notificationsAdapter.getPrefs(userId),
    enabled: !!userId,
    staleTime: 60000 // 1min
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<NotificationPrefs>) => 
      notificationsAdapter.updatePrefs(userId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs', userId] });
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error('Failed to update preferences');
      console.error('[NotificationPrefs] Update error:', error);
    }
  });

  const digestPreviewQuery = useQuery({
    queryKey: ['notification-digest-preview', userId],
    queryFn: () => notificationsAdapter.getDigestPreview(userId),
    enabled: false, // Manual trigger only
    staleTime: 30000 // 30s
  });

  const sendTestDigestMutation = useMutation({
    mutationFn: () => notificationsAdapter.sendTestDigest(userId),
    onSuccess: () => {
      toast.success('Test digest email queued! Check your inbox in a few moments.');
    },
    onError: (error) => {
      toast.error('Failed to queue test digest');
      console.error('[NotificationDigest] Send test error:', error);
    }
  });

  return {
    prefs: query.data,
    isLoading: query.isLoading,
    error: query.error,
    update: updateMutation,
    isUpdating: updateMutation.isPending,
    digestPreview: digestPreviewQuery,
    sendTestDigest: sendTestDigestMutation
  };
}
