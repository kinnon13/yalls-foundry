import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Favorites, type FavoriteType } from '@/ports';
import { useToast } from '@/hooks/use-toast';

export function useFavorite(userId: string, fav_type?: FavoriteType) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const favoritesQ = useQuery({
    queryKey: ['favorites', userId, fav_type],
    queryFn: () => Favorites.list(userId, fav_type),
    staleTime: 30_000,
  });

  const toggle = useMutation({
    mutationFn: ({ fav_type, ref_id }: { fav_type: FavoriteType; ref_id: string }) =>
      Favorites.toggle(userId, fav_type, ref_id),
    onMutate: async ({ fav_type, ref_id }) => {
      await qc.cancelQueries({ queryKey: ['favorites', userId] });
      const prev = qc.getQueryData(['favorites', userId, fav_type]);
      
      qc.setQueryData(['favorites', userId, fav_type], (old: any[] = []) => {
        const exists = old.find(f => f.fav_type === fav_type && f.ref_id === ref_id);
        if (exists) {
          return old.filter(f => f.id !== exists.id);
        }
        return [{ id: crypto.randomUUID(), user_id: userId, fav_type, ref_id, created_at: new Date().toISOString() }, ...old];
      });
      
      return { prev };
    },
    onError: (error, vars, context) => {
      qc.setQueryData(['favorites', userId, vars.fav_type], context?.prev);
      toast({ title: 'Failed to update favorite', description: String(error), variant: 'destructive' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });

  return { ...favoritesQ, toggle };
}
