/* Preview only — no real payments here */
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CheckoutPreview() {
  const send = useCallback((type: 'PAYMENT_SUCCESS' | 'PAYMENT_FAIL') => {
    window.opener?.postMessage({ type, source: 'pay-preview', at: Date.now() }, '*');
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a preview stub for pay.yalls.ai hosted checkout. No real charges occur here.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Checkout (Preview)</CardTitle>
            <CardDescription>
              Simulate payment flows and test postMessage integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Test Payment Outcomes</h3>
              <p className="text-sm text-muted-foreground">
                These buttons will send postMessage events to the opener window to simulate payment results.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => send('PAYMENT_SUCCESS')}>Simulate Success</Button>
              <Button variant="destructive" onClick={() => send('PAYMENT_FAIL')}>Simulate Failure</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
