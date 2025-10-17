/**
 * Orders Panel - Purchases & Sales Management
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, TrendingUp } from 'lucide-react';

type Order = {
  id: string;
  user_id: string;
  total_cents: number;
  status: string;
  created_at: string;
};

export default function OrdersPanel() {
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('orders')
        .select('*')
        .eq('user_id', user.user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('orders')
        .select('*, order_line_items!inner(listing_id, marketplace_listings!inner(seller_entity_id, entities!inner(owner_user_id)))')
        .eq('marketplace_listings.entities.owner_user_id', user.user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const totalPurchases = purchases.reduce((sum, o) => sum + o.total_cents, 0);
  const totalSales = sales.reduce((sum, o) => sum + o.total_cents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Track your purchases and sales</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <ShoppingBag className="w-8 h-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">${(totalPurchases / 100).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Purchases</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">${(totalSales / 100).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          {purchases.map(order => (
            <Card key={order.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">Order #{order.id.slice(0, 8)}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${(order.total_cents / 100).toFixed(2)}</div>
                  <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
          {purchases.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No purchases yet</p>
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {sales.map(order => (
            <Card key={order.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">Sale #{order.id.slice(0, 8)}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">${(order.total_cents / 100).toFixed(2)}</div>
                  <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
          {sales.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No sales yet</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
