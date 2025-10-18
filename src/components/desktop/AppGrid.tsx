/**
 * iOS/Mac-style App Grid
 */

import { useSearchParams } from 'react-router-dom';
import { 
  Calendar, Settings, DollarSign, Trophy, ShoppingCart,
  Building, Users, Sparkles, Tractor, CheckCircle,
  MessageSquare, LayoutDashboard, LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppTile {
  id: string;
  label: string;
  icon: LucideIcon;
  module: string;
}

const APPS: AppTile[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, module: 'overview' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, module: 'events' },
  { id: 'earnings', label: 'Earnings', icon: DollarSign, module: 'earnings' },
  { id: 'incentives', label: 'Incentives', icon: Trophy, module: 'incentives' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, module: 'orders' },
  { id: 'business', label: 'Business', icon: Building, module: 'business' },
  { id: 'producers', label: 'Producers', icon: Users, module: 'producers' },
  { id: 'stallions', label: 'Stallions', icon: Sparkles, module: 'stallions' },
  { id: 'farm_ops', label: 'Farm Ops', icon: Tractor, module: 'farm_ops' },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle, module: 'approvals' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, module: 'messages' },
  { id: 'settings', label: 'Settings', icon: Settings, module: 'settings' },
];

export function AppGrid() {
  const [, setSearchParams] = useSearchParams();

  const handleAppClick = (module: string) => {
    setSearchParams({ m: module });
  };

  return (
    <div className="relative z-20 max-w-5xl mx-auto px-6 py-12">
      <div className="grid grid-cols-4 md:grid-cols-6 gap-6">
        {APPS.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              onClick={() => handleAppClick(app.module)}
              className={cn(
                "group flex flex-col items-center gap-3 p-4 rounded-2xl",
                "bg-background/40 backdrop-blur-xl border border-border/30",
                "hover:bg-background/60 hover:scale-105 hover:border-border/50",
                "active:scale-95 transition-all duration-200",
                "min-h-[120px] cursor-pointer"
              )}
              aria-label={app.label}
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br from-primary/20 to-primary/5",
                "group-hover:from-primary/30 group-hover:to-primary/10",
                "transition-colors duration-200"
              )}>
                <Icon className="w-8 h-8 text-foreground" />
              </div>
              <span className="text-sm font-medium text-center leading-tight">
                {app.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
