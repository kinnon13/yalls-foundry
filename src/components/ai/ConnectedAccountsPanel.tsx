/**
 * Connected Accounts Panel
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, FileText, CreditCard } from 'lucide-react';

export function ConnectedAccountsPanel() {
  const accounts = [
    { name: 'Google Calendar', icon: Calendar, status: 'disconnected', scopes: ['events.read'] },
    { name: 'Gmail', icon: Mail, status: 'disconnected', scopes: ['contacts.read'] },
    { name: 'Google Drive', icon: FileText, status: 'disconnected', scopes: ['files.read'] },
    { name: 'Stripe', icon: CreditCard, status: 'disconnected', scopes: ['payments.read'] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Connected Accounts</h2>
        <p className="text-muted-foreground mt-1">Control which integrations feed Rocker's memory</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {accounts.map(acc => (
          <Card key={acc.name} className="bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <acc.icon className="h-5 w-5" />
                  <CardTitle className="text-base">{acc.name}</CardTitle>
                </div>
                <Badge variant={acc.status === 'connected' ? 'default' : 'secondary'}>
                  {acc.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {acc.scopes.map(s => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  {acc.status === 'connected' ? 'Manage' : 'Connect'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
