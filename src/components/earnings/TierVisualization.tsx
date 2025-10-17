/**
 * @feature(earnings_tiers)
 * Earnings Tier Visualization
 * Progress charts for tier levels
 */

import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Tier {
  level: number;
  name: string;
  minEarnings: number;
  benefits: string[];
  color: string;
}

const tiers: Tier[] = [
  { level: 1, name: 'Bronze', minEarnings: 0, benefits: ['5% commission'], color: 'text-amber-700' },
  { level: 2, name: 'Silver', minEarnings: 1000, benefits: ['7% commission', 'Priority support'], color: 'text-gray-400' },
  { level: 3, name: 'Gold', minEarnings: 5000, benefits: ['10% commission', 'Featured listing'], color: 'text-yellow-500' },
  { level: 4, name: 'Platinum', minEarnings: 10000, benefits: ['15% commission', 'Dedicated account manager'], color: 'text-purple-500' },
];

export function TierVisualization() {
  const currentEarnings = 3200;
  const currentTier = tiers.findIndex(t => currentEarnings >= t.minEarnings);
  const nextTier = tiers[currentTier + 1];
  const progress = nextTier 
    ? ((currentEarnings - tiers[currentTier].minEarnings) / (nextTier.minEarnings - tiers[currentTier].minEarnings)) * 100
    : 100;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-muted-foreground">Current Tier</div>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Trophy className={`h-8 w-8 ${tiers[currentTier].color}`} />
              {tiers[currentTier].name}
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            ${currentEarnings.toLocaleString()}
          </Badge>
        </div>

        {nextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextTier.name}</span>
              <span className="font-medium">
                ${(nextTier.minEarnings - currentEarnings).toLocaleString()} to go
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiers.map((tier, idx) => (
          <Card 
            key={tier.level} 
            className={`p-4 ${idx === currentTier ? 'border-primary bg-primary/5' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className={`h-5 w-5 ${tier.color}`} />
                <span className="font-semibold">{tier.name}</span>
              </div>
              {idx === currentTier && <Badge>Current</Badge>}
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              ${tier.minEarnings.toLocaleString()}+ earned
            </div>
            <ul className="space-y-1">
              {tier.benefits.map((benefit, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
