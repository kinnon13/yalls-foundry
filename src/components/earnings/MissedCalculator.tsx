/**
 * @feature(earnings_missed)
 * Missed Earnings Calculator
 * What-if scenario tool
 */

import React, { useState } from 'react';
import { Calculator, TrendingDown, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function MissedCalculator() {
  const [scenarios] = useState([
    { reason: 'Event cancellations', missed: 1200, count: 3 },
    { reason: 'Incomplete registrations', missed: 850, count: 12 },
    { reason: 'Expired payment links', missed: 450, count: 5 },
  ]);

  const totalMissed = scenarios.reduce((sum, s) => sum + s.missed, 0);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-destructive/10 border-destructive">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <div>
            <div className="font-semibold text-lg">Missed Earnings (30d)</div>
            <div className="text-sm text-muted-foreground">
              Potential revenue lost this month
            </div>
          </div>
        </div>
        <div className="text-4xl font-bold text-destructive">
          ${totalMissed.toLocaleString()}
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Breakdown</h3>
        {scenarios.map((scenario, idx) => (
          <Card key={idx} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">{scenario.reason}</div>
                <div className="text-sm text-muted-foreground">
                  {scenario.count} occurrences
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-destructive">
                  ${scenario.missed.toLocaleString()}
                </div>
                <Badge variant="outline">
                  {((scenario.missed / totalMissed) * 100).toFixed(0)}% of total
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-primary/5 border-primary">
        <div className="flex items-center gap-3">
          <Calculator className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="font-semibold">Recovery Potential</div>
            <div className="text-sm text-muted-foreground">
              By fixing these issues, you could recover up to ${(totalMissed * 0.8).toLocaleString()}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
