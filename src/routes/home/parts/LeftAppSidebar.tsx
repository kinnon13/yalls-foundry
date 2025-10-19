import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEntityCapabilities } from '@/hooks/useEntityCapabilities';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, Settings, DollarSign, Trophy, ShoppingCart,
  Building, Users, Sparkles, Tractor, CheckCircle,
  MessageSquare, User, MapPin, Flame, BookOpen, 
  Store, Activity, Zap, Target, Award, LucideIcon
} from 'lucide-react';

interface AppConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  route?: string;
  module?: string;
}

const apps: AppConfig[] = [
  { key: 'profile', label: 'My Profile', icon: User, route: '/profile' },
  { key: 'feed', label: 'Feed', icon: Flame, module: 'posts' },
  { key: 'market', label: 'Market', icon: Store, route: '/market' },
  { key: 'messages', label: 'Messages', icon: MessageSquare, route: '/messages' },
  { key: 'calendar', label: 'Calendar', icon: Calendar, route: '/calendar' },
  { key: 'activity', label: 'Activity', icon: Activity, route: '/activity' },
  { key: 'discover', label: 'Discover', icon: Zap, route: '/discover' },
  { key: 'map', label: 'Map', icon: MapPin, route: '/map' },
  { key: 'page', label: 'Page', icon: BookOpen, route: '/page' },
  { key: 'goals', label: 'Goals', icon: Target, route: '/goals' },
  { key: 'awards', label: 'Awards', icon: Trophy, route: '/awards' },
  { key: 'settings', label: 'Settings', icon: Settings, route: '/settings' },
  { key: 'business', label: 'Business', icon: Building, route: '/dashboard?m=business' },
  { key: 'earnings', label: 'Earnings', icon: DollarSign, route: '/dashboard?m=earnings' },
  { key: 'orders', label: 'Orders', icon: CheckCircle, route: '/dashboard?m=orders' },
  { key: 'approvals', label: 'Approvals', icon: CheckCircle, route: '/approvals' },
];

interface LeftAppSidebarProps {
  onAppClick: (app: AppConfig) => void;
}

export default function LeftAppSidebar({ onAppClick }: LeftAppSidebarProps) {
  const navigate = useNavigate();
  const { data: entities = [] } = useQuery({
    queryKey: ['my-entities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('entities')
        .select('id, display_name, kind, metadata')
        .eq('owner_user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('display_name');
      return data || [];
    }
  });

  const handleClick = (app: AppConfig) => {
    if (app.route) {
      onAppClick(app);
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/20 border-r p-4">
      {/* Store section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Y'all Store</h2>
        <input
          type="search"
          placeholder="Search..."
          className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
        />
      </div>

      {/* Apps grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-3">
          {apps.map((app) => (
            <button
              key={app.key}
              onClick={() => handleClick(app)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-background border flex items-center justify-center group-hover:border-primary transition-colors">
                <app.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-center leading-tight">{app.label}</span>
            </button>
          ))}
        </div>

        {/* My Entities section */}
        {entities.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">My Entities</h3>
            <div className="grid grid-cols-3 gap-3">
              {entities.slice(0, 6).map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => navigate(`/entity/${entity.id}`)}
                  className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {entity.display_name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-center leading-tight line-clamp-2">
                    {entity.display_name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
