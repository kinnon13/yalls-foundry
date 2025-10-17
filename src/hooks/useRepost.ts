import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Reposts } from '@/ports';
import { useToast } from '@/hooks/use-toast';

export function useRepost() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: ({ source_post_id, caption, targets }: { source_post_id: string; caption?: string; targets?: string[] }) =>
      Reposts.create(source_post_id, caption, targets),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      toast({ title: 'Post reposted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to repost', description: String(error), variant: 'destructive' });
    },
  });

  return { create };
}
