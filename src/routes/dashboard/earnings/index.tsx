/**
 * Earnings Module
 * Summary / Missed / History tabs
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

type Tab = 'summary' | 'missed' | 'history';

export default function EarningsPanel() {
  const [tab, setTab] = useState<Tab>('summary');

  // Mock data - will be real when Stripe enabled
  const mockEarnings = {
    pending: 12450,
    accrued: 4320,
    paid: 18900,
    currentTier: 'free',
    currentCapture: 1.0,
    maxCapture: 4.0,
    missedLastMonth: 3240,
  };

  const missedDelta = mockEarnings.missedLastMonth;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Earnings</h1>
          <p className="text-muted-foreground">Track commissions and payouts</p>
        </div>
        <div className="flex gap-2">
          {(['summary', 'missed', 'history'] as Tab[]).map((t) => (
            <Button
              key={t}
              variant={tab === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {tab === 'summary' && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${(mockEarnings.pending / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Accrued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${(mockEarnings.accrued / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${(mockEarnings.paid / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'missed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-orange-500" size={20} />
              Missed Earnings (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Current Tier</p>
                  <p className="text-lg font-semibold capitalize">{mockEarnings.currentTier}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mockEarnings.currentCapture}% capture rate
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Could have earned</p>
                  <p className="text-2xl font-bold text-orange-500">
                    +${(missedDelta / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    at {mockEarnings.maxCapture}% (Tier 2)
                  </p>
                </div>
              </div>
              <Button className="w-full">
                <TrendingUp size={16} className="mr-2" />
                Upgrade to Capture More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>Transaction history will appear here</p>
            <p className="text-xs mt-2">Available after Stripe integration</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
