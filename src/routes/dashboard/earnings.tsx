/**
 * Earnings Dashboard - Membership Tiers & Line Splits (Logic Only)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

type EarningsEvent = {
  id: string;
  kind: string;
  amount_cents: number;
  occurred_at: string;
  captured: boolean;
};

export default function EarningsDashboard() {
  const { data: events = [] } = useQuery({
    queryKey: ['earnings-events'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('earnings_events')
        .select('*')
        .eq('user_id', user.user?.id)
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return data as EarningsEvent[];
    },
  });

  const { data: ledger } = useQuery({
    queryKey: ['earnings-ledger'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('earnings_ledger')
        .select('*')
        .eq('user_id', user.user?.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const totalPending = events.filter(e => !e.captured).reduce((sum, e) => sum + e.amount_cents, 0);
  const totalCaptured = events.filter(e => e.captured).reduce((sum, e) => sum + e.amount_cents, 0);
  const missedEarnings = (ledger?.missed_cents || 0);

  const membershipTier = ledger?.membership_tier || 'free';
  const captureRate = membershipTier === 'free' ? 1 : membershipTier === 'tier1' ? 2.5 : 4;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Earnings Dashboard</h1>
        <p className="text-muted-foreground">Track your earnings, tiers, and line splits (logic only)</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <DollarSign className="w-8 h-8 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold">${(totalPending / 100).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">${(totalCaptured / 100).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Captured</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold">${(missedEarnings / 100).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Missed</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Membership Tier</div>
            <Badge className="text-lg">{membershipTier.toUpperCase()}</Badge>
            <div className="text-xs text-muted-foreground mt-1">{captureRate}% capture rate</div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Line Splits (60/25/15)</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Business Onboarder</span>
            <Badge variant="outline">60%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Buyer</span>
            <Badge variant="outline">25%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Seller</span>
            <Badge variant="outline">15%</Badge>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="captured">Captured</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2">
          {events.map(event => (
            <Card key={event.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{event.kind}</div>
                <div className="text-sm text-muted-foreground">{new Date(event.occurred_at).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">${(event.amount_cents / 100).toFixed(2)}</div>
                <Badge variant={event.captured ? 'default' : 'secondary'} className="text-xs">
                  {event.captured ? 'Captured' : 'Pending'}
                </Badge>
              </div>
            </Card>
          ))}
          {events.length === 0 && <p className="text-center text-muted-foreground py-8">No earnings events yet</p>}
        </TabsContent>

        <TabsContent value="captured">
          {events.filter(e => e.captured).map(event => (
            <Card key={event.id} className="p-4 flex items-center justify-between">
              <span>{event.kind}</span>
              <span className="font-bold">${(event.amount_cents / 100).toFixed(2)}</span>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending">
          {events.filter(e => !e.captured).map(event => (
            <Card key={event.id} className="p-4 flex items-center justify-between">
              <span>{event.kind}</span>
              <span className="font-bold">${(event.amount_cents / 100).toFixed(2)}</span>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
