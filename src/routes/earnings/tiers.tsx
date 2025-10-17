/**
 * @feature(earnings_tiers)
 * Earnings Tiers Page
 * View tier progress and benefits
 */

import React from 'react';
import { TierVisualization } from '@/components/earnings/TierVisualization';

export default function EarningsTiersPage() {
  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Earnings Tiers</h1>
        <p className="text-muted-foreground">
          Track your progress and unlock benefits
        </p>
      </div>

      <TierVisualization />
    </div>
  );
}
