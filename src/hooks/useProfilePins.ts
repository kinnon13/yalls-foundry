import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfilePins, type ProfilePin } from '@/ports';
import { useToast } from '@/hooks/use-toast';

export function useProfilePins(userId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const pinsQ = useQuery({
    queryKey: ['profilePins', userId],
    queryFn: () => ProfilePins.list(userId),
    staleTime: 30_000,
  });

  const add = useMutation({
    mutationFn: (pin: Omit<ProfilePin, 'id' | 'position' | 'user_id' | 'created_at'>) =>
      ProfilePins.add(userId, pin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profilePins', userId] });
      toast({ title: 'Pin added' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add pin', description: String(error), variant: 'destructive' });
    },
  });

  const remove = useMutation({
    mutationFn: (pinId: string) => ProfilePins.remove(userId, pinId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profilePins', userId] });
      toast({ title: 'Pin removed' });
    },
    onError: (error) => {
      toast({ title: 'Failed to remove pin', description: String(error), variant: 'destructive' });
    },
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => ProfilePins.reorder(userId, orderedIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profilePins', userId] });
    },
    onError: (error) => {
      toast({ title: 'Failed to reorder pins', description: String(error), variant: 'destructive' });
    },
  });

  return { ...pinsQ, add, remove, reorder };
}
