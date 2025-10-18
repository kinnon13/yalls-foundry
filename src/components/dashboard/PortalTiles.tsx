import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useRocker } from '@/lib/ai/rocker';
import { Building2 } from 'lucide-react';

export function PortalTiles() {
  const { log, section } = useRocker();

  const { data, isLoading } = useQuery({
    queryKey: ['dash', 'network'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.session?.user.id;
      if (!uid) return [];
      
      // Defensive fetch with fallback
      try {
        const { data, error } = await supabase.functions.invoke('get_user_network', {
          body: { p_user_id: uid }
        });
        if (!error && Array.isArray(data)) return data;
      } catch (_) {
        // Swallow 404/network errors
      }

      // Fallback: query entities user owns directly
      const { data: entities } = await supabase
        .from('entities')
        .select('id')
        .eq('owner_user_id', uid)
        .limit(10);

      return (entities || []).map(e => ({
        entity_id: e.id,
        rel: 'owner',
        weight: 1.0
      }));
    }
  });

  // Fetch entity details for portal tiles
  const entityIds = Array.isArray(data) ? data.map((n: any) => n.entity_id).filter(Boolean) : [];
  const { data: entities } = useQuery({
    queryKey: ['entities', entityIds.join(',')],
    queryFn: async () => {
      if (!entityIds.length) return [];
      const { data } = await supabase
        .from('entities')
        .select('id, display_name, handle')
        .in('id', entityIds);
      return data || [];
    },
    enabled: entityIds.length > 0
  });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold px-2">Network</h2>
        <div className="flex flex-wrap gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse h-12 w-36 bg-muted/30 rounded-full backdrop-blur-sm" />
          ))}
        </div>
      </section>
    );
  }

  if (!Array.isArray(data) || data.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold px-2 flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        Network
      </h2>
      <div className="flex flex-wrap gap-3">
        {Array.isArray(data) && data.map((n: any) => {
          const entity = entities?.find((e: any) => e.id === n.entity_id);
          const label = entity?.display_name || entity?.handle || 'Workspace';
          
          return (
            <Link
              key={n.entity_id}
              className="inline-flex items-center gap-2.5 rounded-full bg-card/50 backdrop-blur-sm border border-border/50 px-4 py-2.5 hover:bg-card/80 hover:scale-105 transition-all hover:shadow-md"
              to={`/dashboard`}
              onClick={() => log('portal_open', { entity_id: n.entity_id, rel: n.rel })}
            >
              <span className="inline-flex h-7 w-7 rounded-full bg-muted/60 items-center justify-center">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
