import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Bubble = {
  id: string;           // entity id
  display_name: string;
  handle?: string | null;
  kind: 'person' | 'horse' | 'business';
  avatar_url?: string | null;
  status?: string | null;
};

type Options = {
  userId: string | null;
  limit?: number;           // default 8
  publicOnly?: boolean;     // for outward-facing profile
};

export function useTopBubbles({ userId, limit = 8, publicOnly = false }: Options) {
  return useQuery({
    queryKey: ['top-bubbles', userId, limit, publicOnly],
    enabled: !!userId,
    queryFn: async () => {
      // get top pins (by sort_index) for section 'home' and pin_type 'entity'
      let q = supabase
        .from('user_pins')
        .select('ref_id, sort_index, is_public')
        .eq('user_id', userId)
        .eq('pin_type', 'entity')
        .eq('section', 'home')
        .order('sort_index', { ascending: true });

      if (publicOnly) q = q.eq('is_public', true);

      const { data: pins, error } = await q.limit(limit);
      if (error || !pins?.length) return [] as Bubble[];

      // fetch entities in one go - cast ref_id to uuid since it's stored as text
      const ids = pins.map(p => p.ref_id);
      const { data: ents } = await supabase
        .from('entities')
        .select('id, display_name, handle, kind, status, metadata')
        .in('id', ids.map(id => id as any)); // Cast to handle text->uuid

      const map = new Map(ents?.map(e => [e.id, e]) ?? []);
      return pins
        .map(p => map.get(p.ref_id as any))
        .filter(Boolean)
        .map((e: any) => ({
          id: e.id,
          display_name: e.display_name,
          handle: e.handle,
          kind: e.kind === 'horse' ? 'horse' : e.kind === 'person' ? 'person' : 'business',
          status: e.status,
          avatar_url: (e.metadata?.avatar_url || e.metadata?.logo_url) ?? null,
        })) as Bubble[];
    },
  });
}

export function useReorderTopBubbles(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      if (!userId) throw new Error('Not signed in');
      // update sort_index in one batch
      const updates = orderedIds.map((ref_id, i) =>
        supabase.from('user_pins')
          .update({ sort_index: i })
          .match({ user_id: userId, section: 'home', pin_type: 'entity', ref_id })
      );
      await Promise.all(updates);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['top-bubbles', userId] }),
  });
}

export function useToggleTopBubblePublic(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ref_id, is_public }: { ref_id: string; is_public: boolean }) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('user_pins')
        .update({ is_public })
        .match({ user_id: userId, section: 'home', pin_type: 'entity', ref_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['top-bubbles', userId] }),
  });
}
