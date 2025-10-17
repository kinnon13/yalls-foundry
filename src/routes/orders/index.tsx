import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function OrdersIndex() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground mt-1">View your purchase and sales history</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : !orders?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No orders yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge>{order.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), 'PPp')}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        ${(order.total_cents / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.mock_paid_at ? `Paid ${format(new Date(order.mock_paid_at), 'PPp')}` : 'Payment pending'}
                      </p>
                    </div>
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
