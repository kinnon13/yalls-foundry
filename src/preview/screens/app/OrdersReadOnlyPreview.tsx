import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function OrdersReadOnlyPreview() {
  const mockOrders = [
    { id: 'ORD-001', customer: 'John Doe', items: 3, total: '$125.99', status: 'shipped', date: '2025-01-15' },
    { id: 'ORD-002', customer: 'Jane Smith', items: 1, total: '$49.99', status: 'processing', date: '2025-01-16' },
    { id: 'ORD-003', customer: 'Bob Johnson', items: 5, total: '$299.99', status: 'delivered', date: '2025-01-10' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preview stub for app orders view. Read-only snapshot. Financial mutations live on pay.yalls.ai.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Orders (Read-only Preview)
            </CardTitle>
            <CardDescription>
              View order details without mutation capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">127</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Revenue (Mock)</p>
                  <p className="text-2xl font-bold">$12,450</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Recent Orders</h3>
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="p-2 text-left text-sm font-medium">Order ID</th>
                        <th className="p-2 text-left text-sm font-medium">Customer</th>
                        <th className="p-2 text-left text-sm font-medium">Items</th>
                        <th className="p-2 text-left text-sm font-medium">Total</th>
                        <th className="p-2 text-left text-sm font-medium">Status</th>
                        <th className="p-2 text-left text-sm font-medium">Date</th>
                        <th className="p-2 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockOrders.map((order) => (
                        <tr key={order.id} className="border-b last:border-0">
                          <td className="p-2 text-sm font-mono text-xs">{order.id}</td>
                          <td className="p-2 text-sm">{order.customer}</td>
                          <td className="p-2 text-sm">{order.items}</td>
                          <td className="p-2 text-sm font-medium">{order.total}</td>
                          <td className="p-2 text-sm">
                            <Badge 
                              variant={
                                order.status === 'delivered' ? 'default' : 
                                order.status === 'processing' ? 'secondary' : 
                                'outline'
                              }
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="p-2 text-sm">{order.date}</td>
                          <td className="p-2">
                            <Button size="sm" variant="outline">View</Button>
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
