/**
 * iOS/Mac-style App Grid - Large icons like reference
 */

import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Settings, DollarSign, Trophy, ShoppingCart,
  Building, Users, Sparkles, Tractor, CheckCircle,
  MessageSquare, LayoutDashboard, User, MapPin, 
  Flame, BookOpen, Home, Store, Activity, Zap,
  Target, Award, LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppTile {
  id: string;
  label: string;
  icon: LucideIcon;
  route?: string;
  module?: string;
  color?: string;
  badge?: number;
}

const APPS: AppTile[] = [
  // Core Apps
  { id: 'home', label: 'Home', icon: Home, module: 'overview', color: 'from-blue-500/20 to-blue-600/5' },
  { id: 'profile', label: 'Profile', icon: User, route: '/profile', color: 'from-purple-500/20 to-purple-600/5' },
  { id: 'social', label: 'Four', icon: Flame, route: '/social', color: 'from-orange-500/20 to-red-600/5' },
  { id: 'marketplace', label: 'Market', icon: Store, route: '/marketplace', color: 'from-green-500/20 to-emerald-600/5' },
  
  // Communication
  { id: 'messages', label: 'Messages', icon: MessageSquare, module: 'messages', color: 'from-cyan-500/20 to-blue-600/5' },
  
  // Business Tools
  { id: 'calendar', label: 'Calendar', icon: Calendar, module: 'events', color: 'from-red-500/20 to-orange-600/5' },
  { id: 'earnings', label: 'Earnings', icon: DollarSign, module: 'earnings', color: 'from-green-500/20 to-teal-600/5' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, module: 'orders', color: 'from-blue-500/20 to-indigo-600/5' },
  
  // Management
  { id: 'business', label: 'Business', icon: Building, module: 'business', color: 'from-gray-500/20 to-slate-600/5' },
  { id: 'producers', label: 'Producers', icon: Users, module: 'producers', color: 'from-purple-500/20 to-fuchsia-600/5' },
  { id: 'stallions', label: 'Stallions', icon: Sparkles, module: 'stallions', color: 'from-amber-500/20 to-yellow-600/5' },
  { id: 'farm_ops', label: 'Farm Ops', icon: Tractor, module: 'farm_ops', color: 'from-lime-500/20 to-green-600/5' },
  
  // Features
  { id: 'incentives', label: 'Incentives', icon: Trophy, module: 'incentives', color: 'from-yellow-500/20 to-amber-600/5' },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle, module: 'approvals', color: 'from-teal-500/20 to-cyan-600/5' },
  { id: 'activity', label: 'Activity', icon: Activity, route: '/activity', color: 'from-pink-500/20 to-rose-600/5' },
  { id: 'discover', label: 'Discover', icon: Zap, route: '/discover', color: 'from-violet-500/20 to-purple-600/5' },
  
  // Utilities
  { id: 'map', label: 'Map', icon: MapPin, route: '/map', color: 'from-emerald-500/20 to-green-600/5' },
  { id: 'page', label: 'Page', icon: BookOpen, route: '/page', color: 'from-orange-500/20 to-amber-600/5' },
  { id: 'goals', label: 'Goals', icon: Target, route: '/goals', color: 'from-indigo-500/20 to-blue-600/5' },
  { id: 'awards', label: 'Awards', icon: Award, route: '/awards', color: 'from-rose-500/20 to-pink-600/5' },
  
  // Always last
  { id: 'settings', label: 'Settings', icon: Settings, module: 'settings', color: 'from-slate-500/20 to-gray-600/5' },
];

export function AppGrid() {
  const navigate = useNavigate();

  const handleAppClick = (app: AppTile) => {
    if (app.route) {
      navigate(app.route);
    } else if (app.module) {
      navigate(`/dashboard?m=${app.module}`);
    }
  };

  return (
    <div className="relative z-20 w-full h-full overflow-auto">
      <div className="max-w-7xl mx-auto px-12 py-16">
        <div className="grid grid-cols-5 md:grid-cols-7 lg:grid-cols-8 gap-8">
          {APPS.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => handleAppClick(app)}
                className={cn(
                  "group flex flex-col items-center gap-2 p-2",
                  "rounded-3xl transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                )}
                aria-label={app.label}
              >
                {/* App Icon - Large like macOS */}
                <div className={cn(
                  "relative w-20 h-20 rounded-[22px] flex items-center justify-center",
                  "shadow-lg group-hover:shadow-xl transition-all duration-200",
                  `bg-gradient-to-br ${app.color || 'from-primary/20 to-primary/5'}`,
                  "border border-white/10"
                )}>
                  <Icon className="w-10 h-10 text-white drop-shadow-sm" strokeWidth={1.5} />
                  
                  {/* Badge notification */}
                  {app.badge && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-background">
                      {app.badge > 99 ? '99+' : app.badge}
                    </div>
                  )}
                </div>
                
                {/* App Label */}
                <span className="text-xs font-medium text-foreground/90 text-center leading-tight max-w-[80px] truncate">
                  {app.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
