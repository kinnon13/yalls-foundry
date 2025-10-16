import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function OnboardingPreview() {
  const complete = useCallback(() => {
    window.opener?.postMessage({ type: 'KYC_COMPLETE', source: 'pay-preview', at: Date.now() }, '*');
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preview stub for Stripe Connect onboarding. Returns KYC_COMPLETE to opener.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Stripe Connect Onboarding (Preview)</CardTitle>
            <CardDescription>
              Mock KYC/compliance flow for merchant onboarding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Onboarding Steps</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Business information</li>
                <li>Representative details</li>
                <li>Bank account verification</li>
                <li>Tax information</li>
              </ul>
            </div>
            <Button onClick={complete}>Simulate Onboarding Complete</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
