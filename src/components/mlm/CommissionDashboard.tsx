/**
 * Commission Dashboard - Overview of earnings and payouts
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCommissionSummary } from '@/lib/mlm/hooks';
import { DollarSign, Clock, TrendingUp, Wallet } from 'lucide-react';

export function CommissionDashboard() {
  const { data: summary, isLoading } = useCommissionSummary();

  if (isLoading || !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Earned',
      value: `$${summary.total_earned.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      title: 'Pending (Hold)',
      value: `$${summary.pending.toFixed(2)}`,
      icon: Clock,
      color: 'text-yellow-500',
    },
    {
      title: 'Ready to Payout',
      value: `$${summary.payable.toFixed(2)}`,
      icon: Wallet,
      color: 'text-blue-500',
    },
    {
      title: 'Total Orders',
      value: summary.total_orders.toString(),
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {summary.level_breakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Commission by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(summary.level_breakdown).map(([level, amount]) => (
                <div key={level} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{level}</span>
                  <span className="text-sm font-medium">${Number(amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
