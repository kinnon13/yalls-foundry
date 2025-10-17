import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function CartFlyout() {
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('cart_get');
      if (error) throw error;
      return data as { cart_id: string | null; items: any[]; subtotal_cents: number };
    },
    refetchInterval: 5000
  });

  const itemCount = cart?.items?.length || 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Cart ({itemCount})</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {!itemCount ? (
            <p className="text-muted-foreground text-center py-12">Cart is empty</p>
          ) : (
            <>
              <div className="space-y-2">
                {cart.items.slice(0, 3).map(item => (
                  <div key={item.id} className="text-sm">
                    <p className="font-medium truncate">Item</p>
                    <p className="text-muted-foreground">
                      {item.qty} × ${(item.unit_price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
                {itemCount > 3 && (
                  <p className="text-sm text-muted-foreground">+{itemCount - 3} more items</p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal:</span>
                  <span>${(cart.subtotal_cents / 100).toFixed(2)}</span>
                </div>
              </div>

              <Link to="/cart" className="block">
                <Button className="w-full">View Cart</Button>
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
