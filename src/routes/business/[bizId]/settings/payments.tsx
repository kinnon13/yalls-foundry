/**
 * Business Settings - Payments (Stripe Connect Stub)
 * 
 * KYC gate + Stripe onboarding link placeholder
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { businessService } from '@/lib/business/service.supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BusinessPaymentsSettings() {
  const { bizId } = useParams<{ bizId: string }>();

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['business', bizId],
    queryFn: () => businessService.getById(bizId!),
    enabled: !!bizId,
  });

  const { data: needsKyc, isLoading: kycLoading } = useQuery({
    queryKey: ['business-kyc', bizId],
    queryFn: () => businessService.needsKyc(bizId!),
    enabled: !!bizId,
  });

  if (businessLoading || kycLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Manage Stripe Connect for accepting payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {needsKyc ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Stripe account verification required. Complete KYC to accept payments.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Stripe account verified. You can accept payments.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Connect Stripe Account</h3>
            <p className="text-sm text-muted-foreground">
              Link your Stripe account to accept payments from customers. Stripe handles all payment processing securely.
            </p>
            <Button disabled>
              {needsKyc ? 'Complete Stripe Onboarding' : 'Manage Stripe Account'}
            </Button>
            <p className="text-xs text-muted-foreground">
              (Stripe integration coming soon—placeholder for Phase 2)
            </p>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Payment Methods</h3>
            <p className="text-sm text-muted-foreground">
              Accept credit cards, ACH transfers, and wire payments through Stripe.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
