import { useSearchParams } from 'react-router-dom';
import { updateDashParams, type ModuleKey } from '@/lib/dashUrl';
import { getEnabledFeatures } from '@/feature-kernel/registry';
import type { FeatureProps } from '@/feature-kernel/types';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Gift, 
  Sparkles,
  Tractor,
  Calendar,
  ShoppingCart,
  DollarSign,
  MessageSquare,
  Settings,
  CheckCircle,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Badge } from '@/design/components/Badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserEntities } from '@/hooks/useUserEntities';

interface NavItem {
  label: string;
  module: ModuleKey;
  icon: React.ReactNode;
  badge?: boolean;
  requiresEntity?: 'farm' | 'horse' | 'business' | 'producers';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', module: 'overview', icon: <LayoutDashboard size={20} /> },
  { label: 'Business', module: 'business', icon: <Building2 size={20} />, requiresEntity: 'business' },
  { label: 'Producers', module: 'producers', icon: <Users size={20} />, requiresEntity: 'producers' },
  { label: 'Incentives', module: 'incentives', icon: <Gift size={20} /> },
  { label: 'Stallions', module: 'stallions', icon: <Sparkles size={20} />, requiresEntity: 'horse' },
  { label: 'Farm Ops', module: 'farm_ops', icon: <Tractor size={20} />, requiresEntity: 'farm' },
  { label: 'Events', module: 'events', icon: <Calendar size={20} /> },
  { label: 'Orders', module: 'orders', icon: <ShoppingCart size={20} /> },
  { label: 'Earnings', module: 'earnings', icon: <DollarSign size={20} /> },
  { label: 'Messages', module: 'messages', icon: <MessageSquare size={20} />, badge: true },
  { label: 'Approvals', module: 'approvals', icon: <CheckCircle size={20} />, badge: true },
  { label: 'Settings', module: 'settings', icon: <Settings size={20} /> },
];

export function DashboardSidebar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeModule = (searchParams.get('m') as ModuleKey) || 'overview';
  const activeFeatures = (searchParams.get('f') ?? '').split(',').filter(Boolean);
  const { capabilities, isLoading: loadingEntities } = useUserEntities();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_user_id', user.id)
        .is('read_at', null);
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: approvalsCount = 0 } = useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      const { data, error } = await (supabase as any).rpc('get_pending_approvals_count_by_user', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      return data ?? 0;
    },
    refetchInterval: 30000,
  });

  const getBadgeCount = (item: NavItem): number => {
    if (!item.badge) return 0;
    if (item.label === 'Messages') return typeof unreadCount === 'number' ? unreadCount : 0;
    if (item.label === 'Approvals') return typeof approvalsCount === 'number' ? approvalsCount : 0;
    return 0;
  };

  const shouldShowItem = (item: NavItem): boolean => {
    if (!item.requiresEntity) return true;
    
    if (!capabilities) return false;
    
    const entityMap: Record<string, boolean> = {
      farm: capabilities.hasFarm,
      horse: capabilities.hasHorse,
      business: capabilities.hasBusiness,
      producers: capabilities.hasProducers,
    };
    
    return entityMap[item.requiresEntity] || false;
  };

  const visibleItems = NAV_ITEMS.filter(shouldShowItem);
  
  const openFeature = (featureId: string, props?: FeatureProps) => {
    const next = new URLSearchParams(searchParams);
    const list = (next.get('f') ?? '').split(',').filter(Boolean);
    if (!list.includes(featureId)) list.push(featureId);
    next.set('f', list.join(','));
    
    // Set feature props
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        next.set(`fx.${featureId}.${k}`, typeof v === 'string' ? v : JSON.stringify(v));
      }
    }
    
    setSearchParams(next);
  };

  return (
    <div className="w-64 border-r border-border bg-card flex-shrink-0 hidden md:block">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Dashboard</h2>
        
        {/* Create Profile Button */}
        <Button
          variant="secondary"
          size="m"
          onClick={() => setSearchParams({ create: 'profile' })}
          className="w-full justify-start gap-2 mb-4"
        >
          <PlusCircle size={20} />
          <span>Create new profile</span>
        </Button>

        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = activeModule === item.module;
            const badgeCount = getBadgeCount(item);

            return (
              <Button
                key={item.module}
                variant={isActive ? 'secondary' : 'ghost'}
                size="m"
                className={cn(
                  'w-full justify-start gap-3',
                  isActive && 'bg-secondary'
                )}
                onClick={() => {
                  const next = updateDashParams(searchParams, { m: item.module });
                  setSearchParams(next);
                }}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {badgeCount > 0 && (
                  <Badge variant="danger" className="ml-auto">
                    {badgeCount}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Quick Feature Access */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-3">
            Quick Add
          </div>
          <div className="space-y-1">
            {getEnabledFeatures().slice(0, 3).map((feature) => {
              const isActive = activeFeatures.includes(feature.id);
              const Icon = feature.icon || PlusCircle;
              return (
                <Button
                  key={feature.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="m"
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-secondary/50'
                  )}
                  onClick={() => openFeature(feature.id)}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-left text-sm">{feature.title}</span>
                  {isActive && <CheckCircle size={14} className="text-primary" />}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
