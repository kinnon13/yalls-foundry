/**
 * Dashboard Left Rail Navigation
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, Building2, User, Building, Trophy, 
  Calendar, ShoppingBag, DollarSign, Settings, CheckSquare
} from 'lucide-react';

type Module = 'overview' | 'accounts' | 'stallions' | 'farm-ops' | 'incentives' | 'events' | 'orders' | 'earnings' | 'approvals' | 'settings';

interface LeftRailProps {
  activeModule: Module;
  onModuleChange: (module: Module) => void;
}

const modules = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', icon: Building2 },
  { id: 'stallions', label: 'Stallions', icon: User },
  { id: 'farm-ops', label: 'Farm Ops', icon: Building },
  { id: 'incentives', label: 'Incentives', icon: Trophy },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export function LeftRail({ activeModule, onModuleChange }: LeftRailProps) {
  return (
    <aside className="w-64 border-r bg-muted/30 p-4">
      <div className="space-y-1">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Button
              key={module.id}
              variant={activeModule === module.id ? 'default' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeModule === module.id && "bg-primary text-primary-foreground"
              )}
              onClick={() => onModuleChange(module.id as Module)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {module.label}
            </Button>
          );
        })}
      </div>
    </aside>
  );
}
