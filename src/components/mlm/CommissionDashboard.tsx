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

  const commissionTypeLabels: Record<string, string> = {
    platform_buyer_upline: 'Platform Fee (Buyer Upline)',
    platform_seller_upline: 'Platform Fee (Seller Upline)',
    bonus_affiliate_direct: 'Bonus (Affiliate Direct - 80%)',
    bonus_platform: 'Bonus (Platform - 10%)',
    bonus_affiliate_upline: 'Bonus (Affiliate Upline - 10%)',
  };

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

      {summary.type_breakdown && Object.keys(summary.type_breakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commission by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(summary.type_breakdown).map(([type, amount]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {commissionTypeLabels[type] || type}
                  </span>
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
