import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function LabelsPreview() {
  const handleBuyLabel = () => {
    toast.success('Label purchased (preview only)');
    window.opener?.postMessage({ type: 'LABEL_PURCHASED', source: 'pay-preview', at: Date.now() }, '*');
  };

  const mockLabels = [
    { id: '1', orderId: 'ORD-001', carrier: 'USPS', tracking: 'USPS1234567890', cost: '$5.99', status: 'printed' },
    { id: '2', orderId: 'ORD-002', carrier: 'FedEx', tracking: 'FDX9876543210', cost: '$12.50', status: 'shipped' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preview stub for shipping labels. Buy/verify labels; unlocks commissions.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipping Labels (Preview)
            </CardTitle>
            <CardDescription>
              Purchase and manage shipping labels for orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button onClick={handleBuyLabel}>Simulate Label Purchase</Button>
              <p className="text-xs text-muted-foreground">
                Clicking will emit LABEL_PURCHASED event and show toast
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Recent Labels</h3>
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-2 text-left text-sm font-medium">Order</th>
                      <th className="p-2 text-left text-sm font-medium">Carrier</th>
                      <th className="p-2 text-left text-sm font-medium">Tracking</th>
                      <th className="p-2 text-left text-sm font-medium">Cost</th>
                      <th className="p-2 text-left text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLabels.map((label) => (
                      <tr key={label.id} className="border-b last:border-0">
                        <td className="p-2 text-sm">{label.orderId}</td>
                        <td className="p-2 text-sm">{label.carrier}</td>
                        <td className="p-2 text-sm font-mono text-xs">{label.tracking}</td>
                        <td className="p-2 text-sm">{label.cost}</td>
                        <td className="p-2 text-sm capitalize">{label.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
