import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { sendPreviewMessage } from '@/preview/usePreviewMessage';

export default function OnboardingPreview() {
  const complete = useCallback(() => {
    sendPreviewMessage({ 
      type: 'KYC_COMPLETE', 
      source: 'pay-preview', 
      accountId: `acct_preview_${Date.now()}` 
    });
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="fixed top-4 right-4 bg-yellow-500 text-black px-3 py-1 text-xs font-bold uppercase tracking-wider rotate-12 shadow-lg z-50">
        Preview
      </div>
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preview of pay.yalls.ai Stripe Connect onboarding. Mock KYC flow; returns KYC_COMPLETE to opener.
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
