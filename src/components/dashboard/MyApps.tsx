import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppBubble } from './AppBubble';
import { useRocker } from '@/lib/ai/rocker';
import { 
  Building2, MessageSquare, Calendar, 
  Award, BarChart3, Store, Search, Plus, Sparkles, Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AppStoreModal } from './AppStoreModal';
import { useProfilePins } from '@/hooks/useProfilePins';
import { MockIndicator } from '@/components/ui/MockIndicator';

const iconMap: Record<string, any> = {
  'Building2': Building2,
  'Sparkles': Sparkles, // For horse apps
  'MessageSquare': MessageSquare,
  'Calendar': Calendar,
  'Award': Award,
  'BarChart3': BarChart3,
  'Store': Store,
  'Search': Search,
  'Users': MessageSquare,
  'CreditCard': Store,
  'Palette': BarChart3,
};

interface MyAppsProps {
  entityId?: string;
}

export function MyApps({ entityId }: MyAppsProps) {
  const { log } = useRocker();
  const [showAppStore, setShowAppStore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'super_admin'])
          .maybeSingle();
        
        setIsAdmin(!!data);
      }
    };

    checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const pins = useProfilePins(userId);

  const { data: installedApps, isLoading: isLoadingApps } = useQuery({
    queryKey: ['installed-apps', entityId],
    queryFn: async () => {
      if (!entityId) return [];
      
      const { data } = await supabase
        .from('installed_apps')
        .select('app_key, config, app_catalog(*)')
        .eq('entity_id', entityId);
      
      return data || [];
    },
    enabled: !!entityId
  });

  const { data: pinnedEntities, isLoading: isLoadingPins } = useQuery({
    queryKey: ['pinned-entities', userId, pins.data],
    queryFn: async () => {
      if (!pins.data) return { entities: [], ghostPins: [] };
      const entityPins = pins.data.filter(p => p.pin_type === 'entity');
      if (entityPins.length === 0) return { entities: [], ghostPins: [] };

      const entityIds = entityPins.map(p => p.ref_id);
      
      // Chunk large IN queries (100 IDs per chunk)
      const chunk = <T,>(arr: T[], n = 100): T[][] => 
        Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => 
          arr.slice(i * n, (i + 1) * n)
        );
      
      const results = await Promise.all(
        chunk(entityIds, 100).map(ids =>
          supabase
            .from('entities')
            .select('id, display_name, kind, status, handle, owner_user_id, is_mock')
            .in('id', ids)
        )
      );

      const entities = results.flatMap(r => r.data ?? []);
      
      // Track ghost pins (pins pointing to deleted entities)
      const foundIds = new Set(entities.map(e => e.id));
      const ghostPins = entityPins.filter(p => !foundIds.has(p.ref_id));
      
      return { entities, ghostPins };
    },
    enabled: !!userId && !!pins.data && pins.data.length > 0
  });

  const isLoading = isLoadingApps || isLoadingPins;

  const getCategoryAccent = (category: string) => {
    const accents: Record<string, string> = {
      'Identity': 'hsl(258 85% 60%)',
      'Operations': 'hsl(200 90% 55%)',
      'Analytics': 'hsl(12 85% 60%)',
      'Commerce': 'hsl(160 65% 50%)',
      'Appearance': 'hsl(280 70% 60%)',
    };
    return accents[category] || 'hsl(258 85% 60%)';
  };

  const getAppRoute = (appKey: string) => {
    const routes: Record<string, string> = {
      'business_profile': `/workspace/${entityId}/dashboard`,
      'horse_app': `/entities/${entityId}/horses`,
      'events': `/workspace/${entityId}/events`,
      'programs': `/workspace/${entityId}/programs`,
      'messaging': `/workspace/${entityId}/messages`,
      'crm': `/workspace/${entityId}/crm`,
      'equinestats': `/equinestats`,
      'themes': `/workspace/${entityId}/settings?tab=theme`,
    };
    return routes[appKey] || `/workspace/${entityId}/dashboard`;
  };

  const getEntityRoute = (entity: { id: string; owner_user_id?: string | null }) => {
    return entity.owner_user_id === userId 
      ? `/workspace/${entity.id}/dashboard` 
      : `/entities/${entity.id}`;
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold px-2">My Apps</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse h-32 bg-muted/30 rounded-[22px] backdrop-blur-sm" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold px-2">My Apps</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {/* Admin Control Room - First Position */}
          {isAdmin && (
            <AppBubble
              to="/admin/control-room"
              icon={<Shield className="h-6 w-6" />}
              title="Admin Control"
              meta="System admin panel"
              accent="hsl(270 70% 55%)"
              onClick={() => log('tile_open', { section: 'admin', key: 'control-room' })}
              className="ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20"
            />
          )}
          
          {[
            ...(installedApps || []).map((app: any) => ({
              key: `app:${app.app_key}`,
              type: 'app' as const,
              title: app.app_catalog?.name || app.app_key,
              icon: iconMap[app.app_catalog?.icon] || Building2,
              meta: app.app_catalog?.summary,
              accent: getCategoryAccent(app.app_catalog?.category || 'utility'),
              to: getAppRoute(app.app_key),
              onClick: () => log('tile_open', { section: 'apps', key: app.app_key }),
              isMock: false
            })),
            ...(pinnedEntities?.entities || []).map((entity: any) => ({
              key: `entity:${entity.id}`,
              type: 'entity' as const,
              title: entity.display_name,
              icon: Building2,
              meta: entity.status === 'unclaimed' ? 'Unclaimed' : entity.kind,
              accent: entity.status === 'unclaimed' ? 'hsl(45 85% 60%)' : 'hsl(200 90% 55%)',
              to: getEntityRoute(entity),
              onClick: () => log('tile_open', { section: 'pins', pin_type: 'entity', ref_id: entity.id }),
              isMock: entity.is_mock
            })),
            ...(pinnedEntities?.ghostPins || []).map((pin: any) => ({
              key: `ghost:${pin.ref_id}`,
              type: 'ghost' as const,
              title: pin.title || 'Deleted Item',
              icon: Building2,
              meta: 'No longer available',
              accent: 'hsl(0 0% 50%)',
              to: undefined,
              onClick: () => pins.remove.mutate({ pin_type: pin.pin_type, ref_id: pin.ref_id }),
              isMock: false
            }))
          ]
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((tile) => {
              const IconComponent = tile.icon;
              return (
                <div key={tile.key} className="relative">
                  <AppBubble
                    to={tile.to}
                    icon={<IconComponent className="h-6 w-6" />}
                    title={tile.title}
                    meta={tile.meta}
                    accent={tile.accent}
                    onClick={tile.onClick}
                  />
                  {tile.isMock && (
                    <MockIndicator variant="overlay" size="md" />
                  )}
                </div>
              );
            })}
          
          <AppBubble
            icon={<Plus className="h-6 w-6" />}
            title="Add Apps"
            meta="Browse app store"
            onClick={() => {
              log('app_store_open', { entity_id: entityId });
              setShowAppStore(true);
            }}
            accent="hsl(var(--primary))"
          />
        </div>
      </section>

      {showAppStore && (
        <AppStoreModal 
          entityId={entityId} 
          onClose={() => setShowAppStore(false)} 
        />
      )}
    </>
  );
}
