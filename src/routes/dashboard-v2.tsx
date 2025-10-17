/**
 * Dashboard V2 - Owner HQ with capability-gated cards
 * <200 LOC
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Store, 
  Users, 
  Calendar, 
  Package, 
  DollarSign, 
  Bot, 
  Settings as SettingsIcon,
  TrendingUp,
  ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCapabilities } from '@/hooks/useCapabilities';

export default function DashboardV2() {
  const navigate = useNavigate();
  const { hasCapability } = useCapabilities();

  // Quick stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [entities, orders, contacts] = await Promise.all([
        supabase.from('entities').select('id', { count: 'exact', head: true }).eq('owner_user_id', user.id),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('owner_user_id', user.id),
      ]);

      return {
        entities: entities.count ?? 0,
        orders: orders.count ?? 0,
        contacts: contacts.count ?? 0,
      };
    },
  });

  // Next best actions from Rocker
  const { data: nextActions = [] } = useQuery({
    queryKey: ['next-best-actions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('rocker_next_best_actions', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-6">Owner HQ</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="text-2xl font-bold">{stats?.entities || 0}</div>
          <div className="text-sm text-muted-foreground">Owned Pages</div>
        </Card>
        <Card className="p-6">
          <div className="text-2xl font-bold">{stats?.contacts || 0}</div>
          <div className="text-sm text-muted-foreground">CRM Contacts</div>
        </Card>
        <Card className="p-6">
          <div className="text-2xl font-bold">{stats?.orders || 0}</div>
          <div className="text-sm text-muted-foreground">Orders</div>
        </Card>
      </div>

      {/* Next Best Actions */}
      <Card className="p-6 mb-8">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Next Best Actions
        </h3>
        <div className="space-y-3">
          {(!Array.isArray(nextActions) || nextActions.length === 0) && (
            <p className="text-sm text-muted-foreground">No suggestions at this time.</p>
          )}
          {Array.isArray(nextActions) && nextActions.map((action: any, idx: number) => (
            <Button
              key={idx}
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate(action.link)}
            >
              <span className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </span>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            </Button>
          ))}
        </div>
      </Card>

      {/* Dashboard Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {hasCapability('dashboard_business') && (
          <DashboardCard
            icon={Store}
            title="Business"
            description="Manage your entities and storefronts"
            onClick={() => navigate('/entities')}
          />
        )}
        {hasCapability('dashboard_crm') && (
          <DashboardCard
            icon={Users}
            title="CRM"
            description="Contacts, timelines, and tasks"
            onClick={() => navigate('/crm')}
          />
        )}
        {hasCapability('dashboard_events') && (
          <DashboardCard
            icon={Calendar}
            title="Events"
            description="Calendar and producer tools"
            onClick={() => navigate('/events')}
          />
        )}
        {hasCapability('dashboard_orders') && (
          <DashboardCard
            icon={Package}
            title="Orders"
            description="Purchases and sales"
            onClick={() => navigate('/orders')}
          />
        )}
        {hasCapability('dashboard_earnings') && (
          <DashboardCard
            icon={DollarSign}
            title="Earnings"
            description="Commissions and memberships"
            onClick={() => navigate('/earnings')}
          />
        )}
        {hasCapability('dashboard_ai') && (
          <DashboardCard
            icon={Bot}
            title="AI"
            description="Rocker console and preferences"
            onClick={() => navigate('/settings/ai')}
          />
        )}
        {hasCapability('dashboard_settings') && (
          <DashboardCard
            icon={SettingsIcon}
            title="Settings"
            description="Profile, appearance, notifications"
            onClick={() => navigate('/profile')}
          />
        )}
      </div>
    </div>
  );
}

function DashboardCard({ icon: Icon, title, description, onClick }: any) {
  return (
    <Card className="p-6 cursor-pointer hover:bg-accent transition-colors" onClick={onClick}>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}
