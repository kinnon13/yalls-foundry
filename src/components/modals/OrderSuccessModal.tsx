/**
 * Order Success Modal
 * 
 * Displays order confirmation and next actions
 */

import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export function OrderSuccessModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const isOpen = searchParams.get('modal') === 'order_success';
  const orderId = searchParams.get('orderId');

  const handleClose = () => {
    searchParams.delete('modal');
    searchParams.delete('orderId');
    setSearchParams(searchParams, { replace: true });
    document.body.style.overflow = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="max-w-md"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Order Confirmed!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center py-4">
          <p className="text-muted-foreground">
            Thank you for your order. We've sent a confirmation email with your order details.
          </p>
          
          {orderId && (
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono text-sm">{orderId}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={handleClose}>
              Continue Shopping
            </Button>
            <Button variant="outline" onClick={handleClose}>
              View Order History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
