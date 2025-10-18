import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PinnedBubble = {
  id: string;
  display_name: string;
  handle?: string | null;
  kind: 'person' | 'horse' | 'business';
  avatar_url?: string | null;
  is_public?: boolean;
};

type Page = { items: PinnedBubble[]; nextOffset?: number; total?: number };

export function usePinnedBubblesInfinite(userId: string | null, pageSize = 24) {
  return useInfiniteQuery<Page>({
    enabled: !!userId,
    queryKey: ['pinned-bubbles', userId, pageSize],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = (pageParam as number) ?? 0;
      const to = from + pageSize - 1;

      // 1) get pins (ids) page by page ordered by sort_index
      const { data: pins, error: pinErr, count } = await supabase
        .from('user_pins')
        .select('ref_id, metadata, is_public', { count: 'exact' })
        .eq('user_id', userId)
        .eq('pin_type', 'entity')
        .in('section', ['home', 'dashboard'])
        .order('sort_index', { ascending: true })
        .range(from, to);

      if (pinErr) throw pinErr;
      const ids = (pins ?? []).map(p => p.ref_id);
      if (ids.length === 0) {
        return { items: [], total: count ?? 0 };
      }

      // 2) hydrate entities for those ids (in chunks)
      const chunk = <T,>(arr: T[], n = 100) =>
        Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, (i + 1) * n));

      const results = await Promise.all(
        chunk(ids, 100).map(batch =>
          supabase
            .from('entities')
            .select('id, display_name, handle, kind, metadata')
            .in('id', batch.map(id => id as any))
        )
      );

      const entities = results.flatMap(r => r.data ?? []);
      const mapMeta = (m: any) => m?.avatar_url || m?.logo_url || null;

      // keep page order same as pins order
      const items: PinnedBubble[] = ids
        .map(id => {
          const e = entities.find(x => x.id === id);
          if (!e) return null;
          const pin = pins?.find(p => p.ref_id === id);
          return {
            id: e.id,
            display_name: e.display_name,
            handle: e.handle ?? null,
            kind: (e.kind === 'person' ? 'person' : e.kind === 'horse' ? 'horse' : 'business') as PinnedBubble['kind'],
            avatar_url: mapMeta(e.metadata),
            is_public: !!pin?.is_public,
          } as PinnedBubble;
        })
        .filter(Boolean) as PinnedBubble[];

      const loaded = from + items.length;
      const hasMore = count ? loaded < count : items.length === pageSize;

      return {
        items,
        total: count ?? undefined,
        nextOffset: hasMore ? loaded : undefined,
      };
    },
    getNextPageParam: (last) => last?.nextOffset,
  });
}
