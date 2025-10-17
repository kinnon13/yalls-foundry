/**
 * useNotificationPrefs Hook
 * React hooks for notification preferences
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { notificationsAdapter } from '@/lib/adapters/notifications';
import type { NotificationPrefs } from '@/lib/adapters/notifications-types';
import { toast } from 'sonner';

export function useNotificationPrefs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-prefs', user?.id],
    queryFn: () => notificationsAdapter.getPrefs(user!.id),
    enabled: !!user,
    staleTime: 60000 // 1min
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<NotificationPrefs>) => 
      notificationsAdapter.updatePrefs(user!.id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs', user?.id] });
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error('Failed to update preferences');
      console.error('[NotificationPrefs] Update error:', error);
    }
  });

  return {
    prefs: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updatePrefs: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
}

export function useNotificationDigest() {
  const { user } = useAuth();

  const previewQuery = useQuery({
    queryKey: ['notification-digest-preview', user?.id],
    queryFn: () => notificationsAdapter.getDigestPreview(user!.id),
    enabled: !!user,
    staleTime: 30000 // 30s
  });

  const sendTestMutation = useMutation({
    mutationFn: () => notificationsAdapter.sendTestDigest(user!.id),
    onSuccess: () => {
      toast.success('Test digest email queued! Check your inbox in a few moments.');
    },
    onError: (error) => {
      toast.error('Failed to queue test digest');
      console.error('[NotificationDigest] Send test error:', error);
    }
  });

  return {
    preview: previewQuery.data || [],
    isLoadingPreview: previewQuery.isLoading,
    sendTest: sendTestMutation.mutate,
    isSendingTest: sendTestMutation.isPending,
    refetch: previewQuery.refetch
  };
}
