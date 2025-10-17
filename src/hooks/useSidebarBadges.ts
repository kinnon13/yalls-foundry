import { useQuery } from '@tanstack/react-query';
import { rpcWithObs } from '@/lib/supaRpc';
import { useSession } from '@/lib/auth/context';

export function useSidebarBadges() {
  const { session } = useSession();

  const { data: pendingApprovals = 0 } = useQuery({
    queryKey: ['pending-approvals-count', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return 0;
      
      const { data, error } = await rpcWithObs(
        'get_pending_approvals_count_by_user',
        { p_user_id: session.userId },
        { surface: 'sidebar_badge' }
      );
      
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!session?.userId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unread-messages-count', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return 0;
      
      // TODO: Add unread messages count RPC when messages feature is built
      return 0;
    },
    enabled: !!session?.userId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  return {
    pendingApprovals,
    unreadMessages,
  };
}
