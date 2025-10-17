/**
 * Notification Counts Hook
 * Polls every 20s for badge counts
 */

import { useQuery } from '@tanstack/react-query';
import { Notifications } from '@/ports';

export function useNotificationCounts(userId: string) {
  const { data: counts, isLoading } = useQuery({
    queryKey: ['notification-counts', userId],
    queryFn: () => Notifications.counts(userId),
    staleTime: 20_000,
    refetchInterval: 20_000,
    enabled: !!userId,
  });

  return {
    counts: counts || { priority: 0, social: 0, system: 0 },
    isLoading,
  };
}
