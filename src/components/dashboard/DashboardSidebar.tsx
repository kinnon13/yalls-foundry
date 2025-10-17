import { Link, useLocation, useSearchParams } from 'react-router-dom';
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
  Plus
} from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Badge } from '@/design/components/Badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserEntities } from '@/hooks/useUserEntities';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: boolean;
  requiresEntity?: 'farm' | 'horse' | 'business' | 'producers';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Business', path: '/dashboard/business', icon: <Building2 size={20} />, requiresEntity: 'business' },
  { label: 'Producers', path: '/dashboard/producers', icon: <Users size={20} />, requiresEntity: 'producers' },
  { label: 'Incentives', path: '/dashboard/incentives', icon: <Gift size={20} /> },
  { label: 'Stallions', path: '/dashboard/stallions', icon: <Sparkles size={20} />, requiresEntity: 'horse' },
  { label: 'Farm Ops', path: '/dashboard/farm-ops', icon: <Tractor size={20} />, requiresEntity: 'farm' },
  { label: 'Events', path: '/dashboard/events', icon: <Calendar size={20} /> },
  { label: 'Orders', path: '/dashboard/orders', icon: <ShoppingCart size={20} /> },
  { label: 'Earnings', path: '/dashboard/earnings', icon: <DollarSign size={20} /> },
  { label: 'Messages', path: '/messages', icon: <MessageSquare size={20} />, badge: true },
  { label: 'Approvals', path: '/dashboard/approvals', icon: <CheckCircle size={20} />, badge: true },
  { label: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
];

export function DashboardSidebar() {
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
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
  const hiddenItems = NAV_ITEMS.filter(item => item.requiresEntity && !shouldShowItem(item));

  return (
    <div className="w-64 border-r border-border bg-card flex-shrink-0 hidden md:block">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          <Button
            size="s"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setSearchParams({ entity: 'claim' })}
            aria-label="Add entity"
          >
            <Plus size={18} />
          </Button>
        </div>

        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            const badgeCount = getBadgeCount(item);

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="m"
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-secondary'
                  )}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {badgeCount > 0 && (
                    <Badge variant="danger" className="ml-auto">
                      {badgeCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {hiddenItems.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-3">
              Available with entity
            </div>
            <div className="space-y-1">
              {hiddenItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="m"
                  className="w-full justify-start gap-3 opacity-50"
                  onClick={() => {
                    const typeMap = {
                      farm: 'farm',
                      horse: 'horse',
                      business: 'business',
                      producers: 'person',
                    };
                    setSearchParams({ entity: typeMap[item.requiresEntity!] });
                  }}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  <Plus size={14} className="ml-auto" />
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
