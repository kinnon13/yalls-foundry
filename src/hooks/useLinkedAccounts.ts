import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinkedAccounts, type SocialProvider } from '@/ports';
import { useToast } from '@/hooks/use-toast';

export function useLinkedAccounts(userId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const accountsQ = useQuery({
    queryKey: ['linkedAccounts', userId],
    queryFn: () => LinkedAccounts.list(userId),
    staleTime: 60_000,
  });

  const upsert = useMutation({
    mutationFn: ({ provider, handle, proof_url }: { provider: SocialProvider; handle: string; proof_url?: string }) =>
      LinkedAccounts.upsert(userId, provider, handle, proof_url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['linkedAccounts', userId] });
      toast({ title: 'Account linked successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to link account', description: String(error), variant: 'destructive' });
    },
  });

  const remove = useMutation({
    mutationFn: (accountId: string) => LinkedAccounts.remove(userId, accountId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['linkedAccounts', userId] });
      toast({ title: 'Account unlinked' });
    },
    onError: (error) => {
      toast({ title: 'Failed to unlink account', description: String(error), variant: 'destructive' });
    },
  });

  return { ...accountsQ, upsert, remove };
}
