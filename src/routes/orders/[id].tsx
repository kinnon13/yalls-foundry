import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders' as any)
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      
      if (error) throw error;
      return data as any;
    }
  });

  const { data: lineItems } = useQuery({
    queryKey: ['order-items', id],
    enabled: !!order,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_line_items' as any)
        .select('*')
        .eq('order_id', id!);
      
      if (error) throw error;
      return data as any[];
    }
  });

  const printLabelMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/preview-pay-labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ order_id: id })
      });

      if (!response.ok) throw new Error('Failed to mark label printed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Label marked as printed');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Order not found</p>
          <Link to="/orders">
            <Button className="mt-4">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(order.created_at), 'PPp')}
                </p>
              </div>
              <Badge>{order.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Order Items</h3>
              <div className="space-y-2">
                {lineItems?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p>{item.title_snapshot}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.qty} × ${(item.unit_price_cents / 100).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium">
                      ${((item.qty * item.unit_price_cents) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${(order.subtotal_cents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${(order.tax_cents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${(order.shipping_cents / 100).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>${(order.total_cents / 100).toFixed(2)}</span>
              </div>
            </div>

            {order.status === 'paid' && !order.label_printed_at && (
              <Button onClick={() => printLabelMutation.mutate()} className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Mark Label Printed (Seller)
              </Button>
            )}

            {order.label_printed_at && (
              <p className="text-sm text-muted-foreground text-center">
                Label printed on {format(new Date(order.label_printed_at), 'PPp')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
