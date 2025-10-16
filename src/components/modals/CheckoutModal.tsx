/**
 * Checkout Modal
 * 
 * Handles checkout flow: Identify → Shipping → Review → Pay
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { toast } from 'sonner';
import { CreditCard, ChevronRight, ChevronLeft } from 'lucide-react';
import { getCartSessionId } from '@/lib/cart/session';

type CheckoutStep = 'identify' | 'shipping' | 'review' | 'pay';

export function CheckoutModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useSession();
  const [step, setStep] = useState<CheckoutStep>('identify');
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  const isOpen = searchParams.get('modal') === 'checkout';

  useEffect(() => {
    if (isOpen && session?.email) {
      setEmail(session.email);
    }
  }, [isOpen, session]);

  const handleClose = () => {
    searchParams.delete('modal');
    setSearchParams(searchParams, { replace: true });
    document.body.style.overflow = '';
    setStep('identify');
  };

  const handleNext = () => {
    if (step === 'identify' && !email) {
      toast.error('Email is required');
      return;
    }
    
    const steps: CheckoutStep[] = ['identify', 'shipping', 'review', 'pay'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: CheckoutStep[] = ['identify', 'shipping', 'review', 'pay'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const sessionId = getCartSessionId();
      if (!sessionId && !session) {
        throw new Error('No session found');
      }

      const { data: cartData } = await supabase.rpc('cart_get', { 
        p_session_id: sessionId 
      }) as any;

      if (!cartData || cartData.length === 0) {
        throw new Error('Cart is empty');
      }

      const cartId = cartData[0].cart_id;
      const idempotencyKey = `checkout_${cartId}_${Date.now()}_${Math.random()}`;

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { cart_id: cartId, idempotency_key: idempotencyKey },
      });

      if (error) throw error;

      const { order_id, client_secret } = data;

      if (!client_secret) {
        throw new Error('No payment client secret returned');
      }

      // TODO: Mount Stripe Elements with client_secret
      // For now, simulate payment completion
      toast.success('Order created successfully!');
      
      searchParams.set('modal', 'order_success');
      searchParams.set('orderId', order_id);
      setSearchParams(searchParams, { replace: true });
    } catch (error: any) {
      console.error('Checkout failed:', error);
      toast.error(error.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Checkout
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex justify-between mb-6">
          {(['identify', 'shipping', 'review', 'pay'] as CheckoutStep[]).map((s, i) => (
            <div 
              key={s}
              className={`flex-1 text-center pb-2 border-b-2 ${
                step === s ? 'border-primary font-semibold' : 'border-muted'
              }`}
            >
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          {step === 'identify' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={!!session}
                />
              </div>
              {!session && (
                <p className="text-sm text-muted-foreground">
                  Already have an account? <button className="text-primary underline">Sign in</button>
                </p>
              )}
            </div>
          )}

          {step === 'shipping' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={shippingAddress.zip}
                  onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <p className="text-sm text-muted-foreground">Items from cart</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Shipping To</h3>
                <p className="text-sm">{email}</p>
                <p className="text-sm">{shippingAddress.street}</p>
                <p className="text-sm">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
              </div>
            </div>
          )}

          {step === 'pay' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Stripe payment integration coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={step === 'identify'}
            className="flex-1 gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          {step !== 'pay' ? (
            <Button onClick={handleNext} className="flex-1 gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handlePay} disabled={loading} className="flex-1">
              {loading ? 'Processing...' : 'Complete Order'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
