/**
 * Earnings Module
 * 60/25/15 splits, tier capture 1/2.5/4%, missed earnings
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

export function Earnings() {
  const { session } = useSession();

  // Mock tier for now (would come from mlm_user_stats in real app)
  const tierCapture = 1; // Default: Free tier

  const maxTier = 4;
  const missedPercent = maxTier - tierCapture;

  // Mock earnings data (in real app, would come from commissions/payouts tables)
  const mockEarnings = {
    pending_cents: 2500,
    accrued_cents: 15000,
    paid_cents: 45000,
    eligible_cents: 100000,
  };

  const missedCents = (mockEarnings.eligible_cents * missedPercent) / 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">MLM lines & tier capture</p>
      </div>

      {/* Summary Tiles */}
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

      {/* Tier Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tier</CardTitle>
          <CardDescription>Current capture rate: {tierCapture}%</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
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
          <Button variant="outline" className="w-full">
            <TrendingUp className="w-4 h-4 mr-2" />
            Upgrade Tier (Preview)
          </Button>
        </CardContent>
      </Card>

      {/* Split Lines */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Splits</CardTitle>
          <CardDescription>60% Onboarder / 25% Buyer / 15% Seller</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Splits apply to eligible transactions. Upgrades and direct sales excluded.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
