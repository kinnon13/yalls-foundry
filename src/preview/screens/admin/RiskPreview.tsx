import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function RiskPreview() {
  const mockChargebacks = [
    { id: '1', orderId: 'ORD-123', amount: '$450.00', reason: 'Fraudulent', status: 'open', date: '2025-01-15' },
    { id: '2', orderId: 'ORD-089', amount: '$120.00', reason: 'Product not received', status: 'under_review', date: '2025-01-10' },
    { id: '3', orderId: 'ORD-045', amount: '$890.00', reason: 'Product not as described', status: 'won', date: '2024-12-28' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preview stub for admin.yalls.ai risk management. Queue, flags, actions — read-only mock.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk & Chargebacks (Preview)
            </CardTitle>
            <CardDescription>
              Monitor disputes, manage risk flags, and take action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Open Disputes</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Under Review</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">67%</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Chargeback Queue</h3>
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="p-2 text-left text-sm font-medium">Date</th>
                        <th className="p-2 text-left text-sm font-medium">Order</th>
                        <th className="p-2 text-left text-sm font-medium">Amount</th>
                        <th className="p-2 text-left text-sm font-medium">Reason</th>
                        <th className="p-2 text-left text-sm font-medium">Status</th>
                        <th className="p-2 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockChargebacks.map((cb) => (
                        <tr key={cb.id} className="border-b last:border-0">
                          <td className="p-2 text-sm">{cb.date}</td>
                          <td className="p-2 text-sm font-mono text-xs">{cb.orderId}</td>
                          <td className="p-2 text-sm font-medium">{cb.amount}</td>
                          <td className="p-2 text-sm">{cb.reason}</td>
                          <td className="p-2 text-sm">
                            <Badge 
                              variant={
                                cb.status === 'won' ? 'default' : 
                                cb.status === 'open' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {cb.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Button size="sm" variant="outline">Review</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
