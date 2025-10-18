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
      {/* iPhone: px-4 py-8, iPad: px-8 py-12, Mac: px-12 py-16 */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-12 lg:py-16">
        {/* iPhone: 4 cols, iPad: 6 cols, Mac: 7-8 cols */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-4 sm:gap-6 md:gap-7 lg:gap-8">
          {APPS.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => handleAppClick(app)}
                className={cn(
                  "group flex flex-col items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2",
                  "rounded-2xl sm:rounded-3xl transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                )}
                aria-label={app.label}
              >
                {/* App Icon - Responsive sizes: iPhone 60px, iPad 72px, Mac 80-88px */}
                <div className={cn(
                  "relative flex items-center justify-center",
                  "shadow-lg group-hover:shadow-xl transition-all duration-200",
                  `bg-gradient-to-br ${app.color || 'from-primary/20 to-primary/5'}`,
                  "border border-white/10",
                  // iPhone: 60px, iPad: 72px, Mac: 80-88px
                  "w-14 h-14 rounded-[18px]",
                  "sm:w-16 sm:h-16 sm:rounded-[20px]",
                  "md:w-[72px] md:h-[72px] md:rounded-[21px]",
                  "lg:w-20 lg:h-20 lg:rounded-[22px]",
                  "xl:w-[88px] xl:h-[88px] xl:rounded-[24px]"
                )}>
                  <Icon 
                    className={cn(
                      "text-white drop-shadow-sm",
                      // iPhone: 7, iPad: 8, Mac: 10-11
                      "w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 xl:w-11 xl:h-11"
                    )}
                    strokeWidth={1.5} 
                  />
                  
                  {/* Badge notification */}
                  {app.badge && (
                    <div className={cn(
                      "absolute bg-red-500 text-white font-bold rounded-full flex items-center justify-center border-2 border-background",
                      "-top-0.5 -right-0.5 w-5 h-5 text-[10px] sm:-top-1 sm:-right-1 sm:w-6 sm:h-6 sm:text-xs"
                    )}>
                      {app.badge > 99 ? '99+' : app.badge}
                    </div>
                  )}
                </div>
                
                {/* App Label - Responsive text */}
                <span className={cn(
                  "font-medium text-foreground/90 text-center leading-tight truncate",
                  "text-[10px] max-w-[56px]",
                  "sm:text-[11px] sm:max-w-[64px]",
                  "md:text-xs md:max-w-[72px]",
                  "lg:max-w-[80px]",
                  "xl:max-w-[88px]"
                )}>
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
