/**
 * @feature(earnings_missed)
 * Missed Earnings Page
 * Calculate potential lost revenue
 */

import React from 'react';
import { MissedCalculator } from '@/components/earnings/MissedCalculator';

export default function MissedEarningsPage() {
  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Missed Opportunities</h1>
        <p className="text-muted-foreground">
          Identify and recover potential lost revenue
        </p>
      </div>

      <MissedCalculator />
    </div>
  );
}
