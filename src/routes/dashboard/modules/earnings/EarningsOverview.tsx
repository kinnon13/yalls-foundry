/**
 * Earnings Overview - Revenue metrics with live stats
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, Target, Zap, Play, Send, AlertTriangle } from 'lucide-react';

export function EarningsOverview() {
  const { session } = useSession();

  const { data: stats } = useQuery({
    queryKey: ['earnings-stats', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return null;

      const result: any = await supabase
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', session.userId)
        .eq('status', 'active');

      const testResult: any = await supabase
        .from('price_tests')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', session.userId)
        .eq('status', 'running');

      const campaignResult: any = await supabase
        .from('rocker_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.userId)
        .in('status', ['scheduled', 'sending']);

      return {
        activePromos: result.count || 0,
        runningTests: testResult.count || 0,
        activeCampaigns: campaignResult.count || 0,
      };
    },
    enabled: !!session?.userId,
  });

  // Mock earnings data (in real app, would come from commissions/payouts tables)
  type TierCapture = 1 | 2.5 | 4;
  const tierCapture = 1 as TierCapture;
  const maxTier: TierCapture = 4;
  const missedPercent = Math.max(0, maxTier - tierCapture);

  const mockEarnings = {
    pending_cents: 2500,
    accrued_cents: 15000,
    paid_cents: 45000,
    eligible_cents: 100000,
  };

  const missedCents = Math.round((mockEarnings.eligible_cents * missedPercent) / 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Earnings Overview</h2>
        <p className="text-sm text-muted-foreground">Track revenue, commissions, and growth tools</p>
      </div>

      {/* Revenue Tools */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activePromos || 0}</div>
            <p className="text-xs text-muted-foreground">Discounts live now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Tests</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.runningTests || 0}</div>
            <p className="text-xs text-muted-foreground">A/B tests running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Send className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">Scheduled sends</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(mockEarnings.pending_cents / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accrued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(mockEarnings.accrued_cents / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(mockEarnings.paid_cents / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Missed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              ${(missedCents / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Upgrade to capture more
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Actions</CardTitle>
          <CardDescription>Boost your earnings with these tools</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Button variant="outline" className="justify-start h-auto py-4">
            <div className="flex items-start gap-3 text-left">
              <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <div className="font-medium">Create Promotion</div>
                <div className="text-sm text-muted-foreground">Flash sale or boost</div>
              </div>
            </div>
          </Button>

          <Button variant="outline" className="justify-start h-auto py-4">
            <div className="flex items-start gap-3 text-left">
              <Play className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <div className="font-medium">Start Price Test</div>
                <div className="text-sm text-muted-foreground">A/B test your pricing</div>
              </div>
            </div>
          </Button>

          <Button variant="outline" className="justify-start h-auto py-4">
            <div className="flex items-start gap-3 text-left">
              <Send className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">Send Campaign</div>
                <div className="text-sm text-muted-foreground">Reach your audience</div>
              </div>
            </div>
          </Button>

          <Button variant="outline" className="justify-start h-auto py-4">
            <div className="flex items-start gap-3 text-left">
              <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <div className="font-medium">Upgrade Tier</div>
                <div className="text-sm text-muted-foreground">Capture {maxTier}% instead of {tierCapture}%</div>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Tier Info */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Tiers</CardTitle>
          <CardDescription>Current capture rate: {tierCapture}% | Splits: 60/25/15 (Onboarder/Buyer/Seller)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Free (1%)</span>
              <Badge variant={tierCapture === 1 ? 'default' : 'outline'}>
                {tierCapture === 1 ? 'Current' : '—'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Tier 1 (2.5%)</span>
              <Badge variant={tierCapture === 2.5 ? 'default' : 'outline'}>
                {tierCapture === 2.5 ? 'Current' : '—'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Tier 2 (4%)</span>
              <Badge variant={tierCapture === 4 ? 'default' : 'outline'}>
                {tierCapture === 4 ? 'Current' : '—'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
