/**
 * Checkout Page - Stripe Integration
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getMyCart } from '@/lib/marketplace/service.supabase';
import { createCheckoutIdempotent } from '@/lib/marketplace/service.rated';
import { generateULID } from '@/lib/utils/ulid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SEOHelmet } from '@/lib/seo/helmet';
import { formatPrice, calculateCartTotal, getEffectivePrice } from '@/entities/marketplace';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: getMyCart,
  });

  const checkoutMutation = useMutation({
    mutationFn: () => {
      // Generate idempotency key for retry-safe checkout
      const idempotencyKey = `checkout:${generateULID()}`;
      return createCheckoutIdempotent(idempotencyKey, cartItems);
    },
    onSuccess: (data) => {
      toast.success('Order created successfully!');
      console.log('Order created:', data);
      // TODO: Integrate with Stripe payment
      // window.location.href = data.checkoutUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Checkout failed');
    },
  });

  const total = calculateCartTotal(cartItems);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shippingAddress.name || !shippingAddress.street || !shippingAddress.city) {
      toast.error('Please fill in all shipping address fields');
      return;
    }

    checkoutMutation.mutate();
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-muted-foreground">Your cart is empty</p>
          <Button onClick={() => navigate('/marketplace')}>
            Browse Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHelmet title="Checkout" description="Complete your purchase" />
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/cart')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
            <h1 className="text-3xl font-bold">Checkout</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Shipping Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCheckout} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                          id="zip"
                          value={shippingAddress.zip}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={shippingAddress.country}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full gap-2"
                      disabled={checkoutMutation.isPending}
                    >
                      <CreditCard className="h-5 w-5" />
                      {checkoutMutation.isPending ? 'Processing...' : 'Pay with Stripe'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.listing.title} × {item.quantity}</span>
                      <span>{formatPrice(getEffectivePrice(item.listing) * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
