import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BubbleRailTop from '@/components/social/BubbleRailTop';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, Settings, DollarSign, Trophy, ShoppingCart,
  Building, Users, Sparkles, Tractor, CheckCircle,
  MessageSquare, User, MapPin, Flame, BookOpen, 
  Home, Store, Activity, Zap, Target, Award, LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppTile {
  id: string;
  label: string;
  icon: LucideIcon;
  route?: string;
  module?: string;
  color?: string;
}

const APPS: AppTile[] = [
  { id: 'home', label: 'Home', icon: Home, module: 'overview', color: 'from-blue-500/20 to-blue-600/5' },
  { id: 'profile', label: 'Profile', icon: User, route: '/profile', color: 'from-purple-500/20 to-purple-600/5' },
  { id: 'social', label: 'Four', icon: Flame, route: '/social', color: 'from-orange-500/20 to-red-600/5' },
  { id: 'marketplace', label: 'Market', icon: Store, route: '/marketplace', color: 'from-green-500/20 to-emerald-600/5' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, module: 'messages', color: 'from-cyan-500/20 to-blue-600/5' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, module: 'events', color: 'from-red-500/20 to-orange-600/5' },
  { id: 'earnings', label: 'Earnings', icon: DollarSign, module: 'earnings', color: 'from-green-500/20 to-teal-600/5' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, module: 'orders', color: 'from-blue-500/20 to-indigo-600/5' },
  { id: 'business', label: 'Business', icon: Building, module: 'business', color: 'from-gray-500/20 to-slate-600/5' },
  { id: 'producers', label: 'Producers', icon: Users, module: 'producers', color: 'from-purple-500/20 to-fuchsia-600/5' },
  { id: 'stallions', label: 'Stallions', icon: Sparkles, module: 'stallions', color: 'from-amber-500/20 to-yellow-600/5' },
  { id: 'farm_ops', label: 'Farm Ops', icon: Tractor, module: 'farm_ops', color: 'from-lime-500/20 to-green-600/5' },
  { id: 'incentives', label: 'Incentives', icon: Trophy, module: 'incentives', color: 'from-yellow-500/20 to-amber-600/5' },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle, module: 'approvals', color: 'from-teal-500/20 to-cyan-600/5' },
  { id: 'activity', label: 'Activity', icon: Activity, route: '/activity', color: 'from-pink-500/20 to-rose-600/5' },
  { id: 'discover', label: 'Discover', icon: Zap, route: '/discover', color: 'from-violet-500/20 to-purple-600/5' },
  { id: 'map', label: 'Map', icon: MapPin, route: '/map', color: 'from-emerald-500/20 to-green-600/5' },
  { id: 'page', label: 'Page', icon: BookOpen, route: '/page', color: 'from-orange-500/20 to-amber-600/5' },
  { id: 'goals', label: 'Goals', icon: Target, route: '/goals', color: 'from-indigo-500/20 to-blue-600/5' },
  { id: 'awards', label: 'Awards', icon: Award, route: '/awards', color: 'from-rose-500/20 to-pink-600/5' },
  { id: 'settings', label: 'Settings', icon: Settings, module: 'settings', color: 'from-slate-500/20 to-gray-600/5' },
];

export default function AppsPane() {
  const navigate = useNavigate();
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

  // Fetch pinned entities
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
    if (app.route) {
      navigate(app.route);
    } else if (app.module) {
      navigate(`/dashboard?m=${app.module}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bubbles across the very top, sticky below header */}
      <div className="sticky top-14 z-10 bg-background/80 backdrop-blur">
        <BubbleRailTop />
      </div>

      {/* Scale control */}
      <div className="flex items-center gap-3 px-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Tile size</span>
        <input
          type="range"
          min={84}
          max={160}
          step={4}
          value={tile}
          onChange={(e) => setTile(parseInt(e.target.value))}
          className="flex-1 max-w-xs"
        />
        <span className="text-xs text-muted-foreground w-12">{tile}px</span>
      </div>

      {/* Grid of app tiles & pins (scalable) */}
      <div
        style={{ ['--tile' as any]: `${tile}px` }}
        className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(var(--tile),1fr))]"
      >
        {/* Installed apps */}
        {APPS.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              onClick={() => handleAppClick(app)}
              className={cn(
                "group flex flex-col items-center gap-2 p-2",
                "aspect-square rounded-2xl transition-all duration-200",
                "hover:scale-105 active:scale-95",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              )}
              aria-label={app.label}
              title={app.label}
            >
              <div 
                className={cn(
                  "flex items-center justify-center flex-1 w-full",
                  "shadow-lg group-hover:shadow-xl transition-all duration-200",
                  `bg-gradient-to-br ${app.color || 'from-primary/20 to-primary/5'}`,
                  "border border-white/10 rounded-xl"
                )}
              >
                <Icon 
                  className="text-white drop-shadow-sm w-1/2 h-1/2"
                  strokeWidth={1.5} 
                />
              </div>
              <span className="text-[10px] leading-tight text-center font-medium truncate max-w-full">
                {app.label}
              </span>
            </button>
          );
        })}

        {/* Pinned entities */}
        {pinnedEntities.map((entity) => (
          <button
            key={`entity:${entity.id}`}
            onClick={() => navigate(`/entities/${entity.id}`)}
            className={cn(
              "group flex flex-col items-center gap-2 p-2",
              "aspect-square rounded-2xl transition-all duration-200",
              "hover:scale-105 active:scale-95",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            )}
            title={entity.title}
          >
            <div className="flex items-center justify-center flex-1 w-full shadow-lg group-hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-accent/20 to-accent/5 border border-border/60 rounded-xl">
              <div className="w-1/2 h-1/2 rounded-full bg-muted" />
            </div>
            <span className="text-[10px] leading-tight text-center font-medium truncate max-w-full">
              {entity.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
