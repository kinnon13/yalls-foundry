import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('cart_get');
      if (error) throw error;
      return (
        (data as unknown as { cart_id: string | null; items: any[]; subtotal_cents: number }) ??
        { cart_id: null, items: [], subtotal_cents: 0 }
      );
    }
  });

  const { data: listings } = useQuery({
    queryKey: ['cart-listings', cart?.items],
    enabled: !!cart?.items?.length,
    queryFn: async () => {
      const ids = cart!.items.map(i => i.listing_id);
      const { data, error } = await supabase
        .from('listings' as any)
        .select('*')
        .in('id', ids as any);
      
      if (error) throw error;
      return data as any[];
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('cart_items' as any)
        .delete()
        .eq('id', itemId as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed');
    }
  });

  const handleCheckout = async () => {
    try {
      const { data: orderId, error } = await supabase.rpc('order_create_from_cart', {
        p_meta: {},
        p_tax_cents: 0,
        p_shipping_cents: 0
      } as any);

      if (error) throw error;

      // Mock payment
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/preview-pay-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ order_id: orderId })
      });

      if (!response.ok) throw new Error('Payment failed');

      // Rocker hook: log payment
      await supabase.rpc('rocker_log_action', {
        p_user_id: session?.user.id,
        p_agent: 'rocker',
        p_action: 'order_preview_paid',
        p_input: { order_id: orderId },
        p_output: { success: true },
        p_result: 'success'
      });

      toast.success('Order placed!');
      navigate(`/orders/${orderId}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getListingDetails = (itemListingId: string) => {
    return listings?.find(l => l.id === itemListingId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Your Cart</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">Your cart is empty</p>
            </CardContent>
          </Card>
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
            <CardTitle>Your Cart ({cart.items.length} items)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.map((item) => {
              const listing = getListingDetails(item.listing_id);
              return (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{listing?.title || 'Loading...'}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.qty} × ${(item.unit_price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">
                      ${((item.qty * item.unit_price_cents) / 100).toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            <Separator />

            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Subtotal:</span>
              <span>${(cart.subtotal_cents / 100).toFixed(2)}</span>
            </div>

            <Button onClick={handleCheckout} className="w-full" size="lg">
              Proceed to Checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
