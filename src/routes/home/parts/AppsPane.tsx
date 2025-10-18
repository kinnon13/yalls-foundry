import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useEntityCapabilities } from '@/hooks/useEntityCapabilities';
import { AppIconTile } from '@/components/ui/AppIconTile';
import { openInWorkspace } from './WorkspaceHost';
import { 
  Calendar, Settings, DollarSign, Trophy, ShoppingCart,
  Building, Users, Sparkles, Tractor, CheckCircle,
  MapPin, Flame, BookOpen, 
  Store, Activity, Zap, Target, Award, LucideIcon, Plus, Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppTile {
  id: string;
  label: string;
  icon: LucideIcon;
  route?: string;
  module?: string;
  color?: string;
  requireKind?: 'business' | 'farm' | 'horse' | 'stallion' | 'producer' | 'incentive';
}

// Consumer apps - always visible (Messages and My Profile removed - they're in dock/feed header)
const CONSUMER_APPS: AppTile[] = [
  { id: 'social', label: 'Four', icon: Flame, route: '/social', color: 'from-orange-500/20 to-red-600/5' },
  { id: 'marketplace', label: 'Market', icon: Store, route: '/marketplace', color: 'from-green-500/20 to-emerald-600/5' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, module: 'events', color: 'from-red-500/20 to-orange-600/5' },
  { id: 'activity', label: 'Activity', icon: Activity, route: '/activity', color: 'from-pink-500/20 to-rose-600/5' },
  { id: 'discover', label: 'Discover', icon: Zap, route: '/discover', color: 'from-violet-500/20 to-purple-600/5' },
  { id: 'map', label: 'Map', icon: MapPin, route: '/map', color: 'from-emerald-500/20 to-green-600/5' },
  { id: 'page', label: 'Page', icon: BookOpen, route: '/page', color: 'from-orange-500/20 to-amber-600/5' },
  { id: 'goals', label: 'Goals', icon: Target, route: '/goals', color: 'from-indigo-500/20 to-blue-600/5' },
  { id: 'awards', label: 'Awards', icon: Award, route: '/awards', color: 'from-rose-500/20 to-pink-600/5' },
  { id: 'settings', label: 'Settings', icon: Settings, module: 'settings', color: 'from-slate-500/20 to-gray-600/5' },
];

// Management apps - only visible if user owns relevant entity type
const MANAGEMENT_APPS: AppTile[] = [
  { id: 'business', label: 'Business', icon: Building, module: 'business', color: 'from-gray-500/20 to-slate-600/5', requireKind: 'business' },
  { id: 'farm_ops', label: 'Farm', icon: Tractor, module: 'farm_ops', color: 'from-lime-500/20 to-green-600/5', requireKind: 'farm' },
  { id: 'producers', label: 'Producers', icon: Users, module: 'producers', color: 'from-purple-500/20 to-fuchsia-600/5', requireKind: 'producer' },
  { id: 'stallions', label: 'Stallions', icon: Sparkles, module: 'stallions', color: 'from-amber-500/20 to-yellow-600/5', requireKind: 'stallion' },
  { id: 'incentives', label: 'Incentives', icon: Trophy, module: 'incentives', color: 'from-yellow-500/20 to-amber-600/5', requireKind: 'incentive' },
  { id: 'earnings', label: 'Earnings', icon: DollarSign, module: 'earnings', color: 'from-green-500/20 to-teal-600/5' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, module: 'orders', color: 'from-blue-500/20 to-indigo-600/5' },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle, module: 'approvals', color: 'from-teal-500/20 to-cyan-600/5' },
];

type Bubble = { id: string; display_name: string; avatar_url?: string | null };

export default function AppsPane() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [tile, setTile] = useState(() => 
    Number(localStorage.getItem('apps.tileSize') || 112)
  );

  useEffect(() => {
    localStorage.setItem('apps.tileSize', String(tile));
  }, [tile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Get entity capabilities
  const { data: capabilities = {} } = useEntityCapabilities(userId);

  // Filter management apps based on capabilities
  const filteredManagementApps = useMemo(() => {
    return MANAGEMENT_APPS.filter(app => {
      if (app.requireKind) {
        return (capabilities[app.requireKind] ?? 0) > 0;
      }
      return true;
    });
  }, [capabilities]);

  // Combine all visible apps
  const visibleApps = useMemo(() => {
    const apps = [...CONSUMER_APPS];
    apps.push(...filteredManagementApps);
    return apps;
  }, [filteredManagementApps]);

  // Show "Create Profile" tile if user has no managed entities
  const hasNoManagedEntities = useMemo(() => {
    const totalEntities = Object.values(capabilities).reduce((sum, count) => sum + count, 0);
    return totalEntities === 0;
  }, [capabilities]);

  // Favorites bubbles (entity pins)
  const { data: bubbles = [] } = useQuery({
    queryKey: ['fav-bubbles', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Bubble[]> => {
      const { data: pins } = await supabase
        .from('user_pins')
        .select('ref_id')
        .eq('user_id', userId!)
        .eq('pin_type', 'entity')
        .eq('section', 'home')
        .order('sort_index');
      if (!pins?.length) return [];
      const ids = pins.map(p => p.ref_id);
      const { data: ents } = await supabase
        .from('entities')
        .select('id, display_name, metadata')
        .in('id', ids);
      return (ents ?? []).map(e => ({
        id: e.id,
        display_name: e.display_name,
        avatar_url: (e.metadata as any)?.avatar_url || (e.metadata as any)?.logo_url || null
      }));
    }
  });

  // Pinned entities for bottom counter
  const { data: pinnedEntities = [] } = useQuery({
    queryKey: ['pinned-entities', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data } = await supabase
        .from('profile_pins')
        .select('item_id, item_data')
        .eq('profile_id', userId)
        .eq('item_type', 'entity');
      
      return (data || []).map(pin => ({
        id: pin.item_id,
        title: (pin.item_data as any)?.title || 'Untitled'
      }));
    },
    enabled: !!userId,
  });

  const handleAppClick = (app: AppTile) => {
    // Open in workspace for supported apps
    if (app.id === 'social') return openInWorkspace(sp, setSp, 'social');
    if (app.id === 'marketplace') return openInWorkspace(sp, setSp, 'marketplace');
    if (app.id === 'discover') return openInWorkspace(sp, setSp, 'discover');
    
    // Fallback for module-based apps or unsupported routes
    if (app.route) {
      navigate(app.route);
    } else if (app.module) {
      navigate(`/dashboard?m=${app.module}`);
    }
  };

  const emptyCount = 8; // show 8 placeholders if none yet

  return (
    <div className="mx-auto max-w-[1100px] w-full">
      {/* Favorites header */}
      <div className="px-1 pb-1 text-sm font-semibold text-foreground">Favorites</div>

      {/* Sticky favorites rail */}
      <div className="sticky top-0 z-10 bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 mb-3">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-1">
          {(bubbles.length ? bubbles : Array.from({ length: emptyCount })).map((b, i) => (
            <button
              key={(b as any)?.id ?? `placeholder-${i}`}
              className="size-12 rounded-full ring-1 ring-border overflow-hidden shrink-0 bg-muted/30"
              title={(b as any)?.display_name ?? 'Empty'}
            >
              {(b as any)?.avatar_url
                ? <img className="w-full h-full object-cover" src={(b as any).avatar_url!} alt="" />
                : null}
            </button>
          ))}
          {/* Add bubble */}
          <button
            onClick={() => navigate('/favorites/picker')}
            className="size-12 shrink-0 rounded-full border border-dashed border-primary/60 text-primary grid place-items-center"
            aria-label="Add favorite"
            title="Add favorite"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tile size slider */}
      <div className="flex items-center gap-3 px-1 py-2 text-sm mb-4">
        <span className="text-muted-foreground whitespace-nowrap">Tile size</span>
        <input
          type="range"
          min={88}
          max={156}
          step={4}
          value={tile}
          onChange={(e) => setTile(parseInt(e.target.value))}
          className="flex-1 max-w-[220px]"
        />
        <span className="tabular-nums text-muted-foreground w-12">{tile}px</span>
      </div>

      {/* Apps grid */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${tile}px, 1fr))`,
        }}
      >
        {/* Installed apps */}
        {visibleApps.map((app) => (
          <AppIconTile
            key={app.id}
            icon={app.icon}
            label={app.label}
            size={tile}
            onClick={() => handleAppClick(app)}
          />
        ))}

        {/* Pinned entities */}
        {pinnedEntities.map((entity) => (
          <AppIconTile
            key={`entity:${entity.id}`}
            icon={Circle}
            label={entity.title}
            size={tile}
            onClick={() => navigate(`/entities/${entity.id}`)}
          />
        ))}
      </div>

      {/* Create Profile Icon - Fixed to bottom right */}
      {hasNoManagedEntities && (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => navigate('/profiles/new')}
            className={cn(
              "group flex flex-col items-center gap-2 p-2",
              "w-20 aspect-square rounded-2xl transition-all duration-300",
              "border border-white/10 bg-white/[0.04]",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,.06),0_10px_30px_-12px_rgba(0,0,0,.6)]",
              "hover:bg-white/[0.08] hover:scale-110 active:scale-95",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            )}
            aria-label="Create new profile"
            title="Create new profile"
          >
            <div className="flex items-center justify-center flex-1 w-full transition-all duration-300">
              <Plus 
                className="text-primary drop-shadow-md w-[28px] h-[28px] group-hover:scale-110 transition-transform duration-300"
                strokeWidth={2.5} 
              />
            </div>
            <span className="text-[13px] leading-tight text-center font-semibold text-white/80 truncate max-w-full">
              Create new profile
            </span>
          </button>
          <div className="text-xs text-muted-foreground text-center font-medium">
            {pinnedEntities.length} pinned
          </div>
        </div>
      )}
    </div>
  );
}
