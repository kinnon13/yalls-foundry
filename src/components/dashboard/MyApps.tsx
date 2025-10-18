import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppBubble } from './AppBubble';
import { useRocker } from '@/lib/ai/rocker';
import { 
  Building2, MessageSquare, Calendar, 
  Award, BarChart3, Store, Search, Plus, Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { AppStoreModal } from './AppStoreModal';

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

  const { data: installedApps, isLoading } = useQuery({
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
          {installedApps && installedApps.map((app: any) => {
            const catalog = app.app_catalog;
            const IconComponent = iconMap[catalog?.icon] || Building2;
            
            return (
              <AppBubble
                key={app.app_key}
                to={getAppRoute(app.app_key)}
                icon={<IconComponent className="h-6 w-6" />}
                title={catalog?.name || app.app_key}
                meta={catalog?.summary}
                accent={getCategoryAccent(catalog?.category)}
                onClick={() => log('app_open', { app_key: app.app_key, entity_id: entityId })}
              />
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
