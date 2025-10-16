/**
 * Cart Modal
 * 
 * Displays cart items with ability to update qty, remove items, and proceed to checkout
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { toast } from 'sonner';
import { Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { getCartSessionId } from '@/lib/cart/session';

interface CartItem {
  item_id: string;
  listing_id: string;
  qty: number;
  price_cents: number;
  variant: any;
}

export function CartModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const isOpen = searchParams.get('modal') === 'cart';

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const sessionId = getCartSessionId();
      const { data, error } = await supabase.rpc('cart_get', { 
        p_session_id: sessionId 
      }) as any;
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    searchParams.delete('modal');
    setSearchParams(searchParams, { replace: true });
    document.body.style.overflow = '';
  };

  const handleCheckout = () => {
    searchParams.set('modal', 'checkout');
    setSearchParams(searchParams, { replace: true });
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading cart...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={handleClose}>Continue Shopping</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.item_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">Listing {item.listing_id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      ${(item.price_cents / 100).toFixed(2)} × {item.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">
                      ${((item.price_cents * item.qty) / 100).toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast.info('Remove item - coming soon')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>${(subtotal / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Continue Shopping
              </Button>
              <Button onClick={handleCheckout} className="flex-1 gap-2">
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
