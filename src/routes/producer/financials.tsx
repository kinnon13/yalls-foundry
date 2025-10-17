/**
 * @feature(producer_financials)
 * Financial Reports
 * Revenue breakdown and analytics
 */

import React from 'react';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FinancialsPage() {
  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">Track your event revenue and payouts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-5 w-5" />
            <span className="text-sm">Total Revenue</span>
          </div>
          <div className="text-3xl font-bold">$24,580</div>
          <Badge variant="default" className="mt-2">+12% vs last month</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Net Earnings</span>
          </div>
          <div className="text-3xl font-bold">$20,893</div>
          <Badge variant="secondary" className="mt-2">After fees</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-5 w-5" />
            <span className="text-sm">Next Payout</span>
          </div>
          <div className="text-3xl font-bold">$5,200</div>
          <Badge variant="outline" className="mt-2">Due in 3 days</Badge>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue by Event</h3>
        <div className="space-y-3">
          {[
            { name: 'Summer Classic', revenue: 8500, registrations: 45 },
            { name: 'Fall Championship', revenue: 9800, registrations: 52 },
            { name: 'Winter Series', revenue: 6280, registrations: 34 },
          ].map((event, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">{event.name}</div>
                <div className="text-sm text-muted-foreground">
                  {event.registrations} registrations
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">${event.revenue.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
