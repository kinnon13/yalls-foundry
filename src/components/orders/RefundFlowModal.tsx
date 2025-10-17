/**
 * @feature(orders_refund_flow)
 * Refund Flow Modal
 * Full/partial refund processing
 */

import React, { useState } from 'react';
import { DollarSign, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface RefundFlowModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderAmount: number;
}

export function RefundFlowModal({ 
  open, 
  onClose, 
  orderId, 
  orderAmount 
}: RefundFlowModalProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [amount, setAmount] = useState(orderAmount);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue Refund</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Order Total</div>
              <div className="text-xl font-bold">${orderAmount.toFixed(2)}</div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Refund Type</Label>
            <RadioGroup value={refundType} onValueChange={(v) => setRefundType(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="font-normal">
                  Full Refund (${orderAmount.toFixed(2)})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="font-normal">
                  Partial Refund
                </Label>
              </div>
            </RadioGroup>
          </div>

          {refundType === 'partial' && (
            <div className="space-y-2">
              <Label>Refund Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                max={orderAmount}
                step="0.01"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="Enter reason for refund..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              This action cannot be undone. The refund will be processed immediately.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive">
            Issue ${(refundType === 'full' ? orderAmount : amount).toFixed(2)} Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
