/**
 * KPI Tiles Component
 * Shows key metrics for the user
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ShoppingBag, Users } from 'lucide-react';

export function KpiTiles() {
  const { session } = useSession();

  const { data: entitiesCount } = useQuery({
    queryKey: ['entities-count', session?.userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', session?.userId);
      return count || 0;
    },
    enabled: !!session?.userId,
  });

  const { data: ordersCount } = useQuery({
    queryKey: ['orders-count', session?.userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session?.userId);
      return count || 0;
    },
    enabled: !!session?.userId,
  });

  const { data: contactsCount } = useQuery({
    queryKey: ['contacts-count', session?.userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('crm_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', session?.userId);
      return count || 0;
    },
    enabled: !!session?.userId,
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entities/Pages</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{entitiesCount || 0}</div>
          <p className="text-xs text-muted-foreground">Owned accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orders</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ordersCount || 0}</div>
          <p className="text-xs text-muted-foreground">Purchases & sales</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contacts</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{contactsCount || 0}</div>
          <p className="text-xs text-muted-foreground">CRM contacts</p>
        </CardContent>
      </Card>
    </div>
  );
}
