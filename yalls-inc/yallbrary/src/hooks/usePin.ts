/**
 * Role: React hook for pinning/unpinning apps with optimistic updates
 * Path: yalls-inc/yallbrary/src/hooks/usePin.ts
 * Imports: @tanstack/react-query, @/lib/auth/context
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth/context';
import { fetchPinnedApps, pinApp, unpinApp, reorderPins } from '../services/store.service';

export function usePin() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.userId || '';

  const { data: pinnedApps = [], isLoading } = useQuery({
    queryKey: ['yallbrary-pins', userId],
    queryFn: () => fetchPinnedApps(userId),
    enabled: !!userId,
  });

  const pinMutation = useMutation({
    mutationFn: ({ appId, position }: { appId: string; position: number }) =>
      pinApp(userId, appId, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yallbrary-pins', userId] });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: (appId: string) => unpinApp(userId, appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yallbrary-pins', userId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (appIds: string[]) => reorderPins(userId, appIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yallbrary-pins', userId] });
    },
  });

  return {
    pinnedApps,
    isLoading,
    pin: pinMutation.mutateAsync,
    unpin: unpinMutation.mutateAsync,
    reorder: reorderMutation.mutateAsync,
  };
}
