import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PayoutsPreview() {
  const mockPayouts = [
    { id: '1', amount: '$1,250.00', status: 'pending', date: '2025-01-20', schedule: 'Weekly' },
    { id: '2', amount: '$3,400.00', status: 'paid', date: '2025-01-13', schedule: 'Weekly' },
    { id: '3', amount: '$2,100.00', status: 'paid', date: '2025-01-06', schedule: 'Weekly' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="fixed top-4 right-4 bg-yellow-500 text-black px-3 py-1 text-xs font-bold uppercase tracking-wider rotate-12 shadow-lg z-50">
        Preview
      </div>
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preview of pay.yalls.ai payouts. Balances, schedules, and holds are mocked.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Payouts (Preview)</CardTitle>
            <CardDescription>
              View balances, payout schedules, and holds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold">$4,750.00</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Pending Balance</p>
                  <p className="text-2xl font-bold">$1,250.00</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Next Payout</p>
                  <p className="text-2xl font-bold">Jan 27</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Recent Payouts</h3>
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="p-2 text-left text-sm font-medium">Date</th>
                        <th className="p-2 text-left text-sm font-medium">Amount</th>
                        <th className="p-2 text-left text-sm font-medium">Schedule</th>
                        <th className="p-2 text-left text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockPayouts.map((payout) => (
                        <tr key={payout.id} className="border-b last:border-0">
                          <td className="p-2 text-sm">{payout.date}</td>
                          <td className="p-2 text-sm font-medium">{payout.amount}</td>
                          <td className="p-2 text-sm">{payout.schedule}</td>
                          <td className="p-2 text-sm">
                            <Badge variant={payout.status === 'paid' ? 'default' : 'secondary'}>
                              {payout.status}
                            </Badge>
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
