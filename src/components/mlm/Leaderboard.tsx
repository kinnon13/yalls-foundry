/**
 * MLM Leaderboard - Top performers in downline
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDownlineLeaderboard } from '@/lib/mlm/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, ShoppingCart } from 'lucide-react';

export function Leaderboard() {
  const { data: salesLeaders } = useDownlineLeaderboard('sales', 10);
  const { data: orderLeaders } = useDownlineLeaderboard('orders', 10);

  const LeaderboardList = ({ data }: { data: typeof salesLeaders }) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No activity yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {data.map((entry) => (
          <div
            key={entry.party_id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  entry.rank === 1
                    ? 'bg-yellow-100 text-yellow-600'
                    : entry.rank === 2
                    ? 'bg-gray-100 text-gray-600'
                    : entry.rank === 3
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {entry.rank <= 3 ? <Trophy className="h-4 w-4" /> : entry.rank}
              </div>
              <div>
                <p className="font-medium text-sm">{entry.display_name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {entry.party_kind}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">${entry.total_sales.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {entry.total_orders} orders
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Sales
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Most Orders
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sales" className="mt-4">
            <LeaderboardList data={salesLeaders} />
          </TabsContent>
          <TabsContent value="orders" className="mt-4">
            <LeaderboardList data={orderLeaders} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
