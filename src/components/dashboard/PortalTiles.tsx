import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRocker } from '@/lib/ai/rocker';
import { Building2, ExternalLink } from 'lucide-react';

export function PortalTiles() {
  const { log, section } = useRocker();

  useEffect(() => {
    log('page_view', { section, component: 'portal_tiles' });
  }, [log, section]);

  const { data, isLoading } = useQuery({
    queryKey: ['dash', 'network'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.session?.user.id;
      if (!uid) return [];
      
      // Use functions.invoke until types regenerate
      const { data } = await supabase.functions.invoke('get_user_network', {
        body: { p_user_id: uid }
      });
      return Array.isArray(data) ? data : [];
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
      <Card>
        <CardHeader>
          <CardTitle>Your portals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-10 w-32 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!Array.isArray(data) || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Your portals
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {Array.isArray(data) && data.map((n: any) => {
          const entity = entities?.find((e: any) => e.id === n.entity_id);
          const label = entity?.display_name || entity?.handle || 'Workspace';
          
          return (
            <Link
              key={n.entity_id}
              className="inline-flex items-center gap-2 rounded border px-3 py-2 hover:bg-accent hover:border-primary/50 transition-colors"
              to={`/workspace/${n.entity_id}/dashboard`}
              onClick={() => log('portal_open', { entity_id: n.entity_id, rel: n.rel })}
            >
              <span className="inline-flex h-6 w-6 rounded bg-muted items-center justify-center">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{label}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
