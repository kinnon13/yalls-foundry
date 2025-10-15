/**
 * Shopping Cart Page
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getMyCart, 
  updateCartQuantity, 
  removeFromCart, 
  clearCart 
} from '@/lib/marketplace/service.supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEOHelmet } from '@/lib/seo/helmet';
import { formatPrice, calculateCartTotal, getEffectivePrice } from '@/entities/marketplace';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, ShoppingBag } from 'lucide-react';
import { useSession } from '@/lib/auth/context';

export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getMyCart,
    enabled: !!session,
  });

  const updateQtyMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => updateCartQuantity(id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error('Failed to update quantity');
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => {
      toast.success('Removed from cart');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error('Failed to remove item');
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      toast.success('Cart cleared');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const total = calculateCartTotal(cartItems);

  const handleCheckout = () => {
    if (!session) {
      toast.error('Please sign in to checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (!session) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-muted-foreground">Please sign in to view your cart</p>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHelmet title="Shopping Cart" description="Review your cart and proceed to checkout" />
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/marketplace')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">Shopping Cart</h1>
            </div>
            {cartItems.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <Link to="/marketplace">
                  <Button>Browse Marketplace</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Cart Items */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="py-4">
                      <div className="flex gap-4">
                        {item.listing.images?.[0] && (
                          <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                            <img 
                              src={item.listing.images[0]} 
                              alt={item.listing.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <Link 
                                to={`/marketplace/${item.listing.id}`}
                                className="font-semibold hover:underline"
                              >
                              {item.listing.title}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(getEffectivePrice(item.listing))} each
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMutation.mutate(item.id)}
                              disabled={removeMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Qty:</span>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const qty = parseInt(e.target.value);
                                  if (qty >= 1 && qty <= item.listing.stock_quantity) {
                                    updateQtyMutation.mutate({ id: item.id, qty });
                                  }
                                }}
                                className="w-20"
                                min={1}
                                max={item.listing.stock_quantity}
                              />
                            </div>
                            <p className="font-semibold">
                              {formatPrice(getEffectivePrice(item.listing) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Total & Checkout */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-lg">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatPrice(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-2xl font-bold pt-4 border-t">
                    <span>Total:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
