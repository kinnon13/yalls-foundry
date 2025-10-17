/**
 * Orders Module
 * Purchases & sales with mock labels
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Printer, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Orders() {
  const { session } = useSession();
  const { toast } = useToast();

  const { data: purchases } = useQuery({
    queryKey: ['my-purchases', session?.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session?.userId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!session?.userId,
  });

  const { data: sales } = useQuery({
    queryKey: ['my-sales', session?.userId],
    queryFn: async () => {
      // Get orders where user is the seller (via line items)
      const { data } = await supabase
        .from('orders')
        .select('*, order_line_items(listing_id, marketplace_listings(seller_entity_id))')
        .order('created_at', { ascending: false });
      
      // Filter to only orders where this user is seller
      return data?.filter((order: any) =>
        order.order_line_items?.some((item: any) =>
          item.marketplace_listings?.seller_entity_id === session?.userId
        )
      ) || [];
    },
    enabled: !!session?.userId,
  });

  const handlePrintLabel = () => {
    toast({ title: 'Label printed (mock)', description: 'Commission eligibility updated' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Purchases & sales</p>
      </div>

      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4 mt-4">
          {purchases && purchases.length > 0 ? (
            purchases.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        {new Date(order.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge>{order.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold">
                    ${((order.total_cents || 0) / 100).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">No purchases yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4 mt-4">
          {sales && sales.length > 0 ? (
            sales.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        {new Date(order.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge>{order.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      ${((order.total_cents || 0) / 100).toFixed(2)}
                    </p>
                    <Button size="sm" variant="outline" onClick={handlePrintLabel}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print Label (Mock)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">No sales yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
