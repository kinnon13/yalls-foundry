/**
 * StatTile - KPI/metric display with optional trend
 */

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    positive?: boolean;
  };
  className?: string;
}

export function StatTile({ label, value, icon: Icon, trend, className }: StatTileProps) {
  const trendPositive = trend?.positive ?? (trend?.value ?? 0) > 0;
  const TrendIcon = trendPositive ? TrendingUp : TrendingDown;

  return (
    <Card className={cn('transition-colors hover:bg-accent/50', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
          </div>
          {Icon && (
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
        
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            <TrendIcon className={cn(
              'h-4 w-4',
              trendPositive ? 'text-success' : 'text-danger'
            )} />
            <span className={cn(
              'font-medium tabular-nums',
              trendPositive ? 'text-success' : 'text-danger'
            )}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
