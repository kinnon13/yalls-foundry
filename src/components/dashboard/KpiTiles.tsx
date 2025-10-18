import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calendar, Eye } from 'lucide-react';

interface KpiData {
  revenue_cents: number;
  orders: number;
  entries: number;
  views: number;
  horizon?: string;
  generated_at?: string;
}

interface KpiTilesProps {
  entityId: string;
  horizon?: string;
}

/**
 * KPI Tiles Component
 * 
 * Displays live workspace KPIs with auto-refresh
 * Polls every 120 seconds for updated metrics
 */
export function KpiTiles({ entityId, horizon = '7d' }: KpiTilesProps) {
  const { data: kpis, isLoading, error } = useQuery({
    queryKey: ['workspace-kpis', entityId, horizon],
    queryFn: async () => {
      // Use functions.invoke temporarily until types regenerate
      const { data, error } = await supabase.functions.invoke('get_workspace_kpis', {
        body: {
          p_entity_id: entityId,
          p_horizon: horizon
        }
      });

      if (error) throw error;
      return data as KpiData;
    },
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000, // Consider data stale after 1 minute
    enabled: !!entityId
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-24 mb-2" />
              <div className="h-3 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading KPIs</CardTitle>
          <CardDescription>{(error as Error).message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tiles = [
    {
      title: 'Revenue',
      value: formatCurrency(kpis?.revenue_cents || 0),
      description: `Last ${horizon}`,
      icon: DollarSign,
      trend: null // TODO: Calculate trend from historical data
    },
    {
      title: 'Orders',
      value: (kpis?.orders || 0).toLocaleString(),
      description: `Last ${horizon}`,
      icon: ShoppingCart,
      trend: null
    },
    {
      title: 'Entries',
      value: (kpis?.entries || 0).toLocaleString(),
      description: `Last ${horizon}`,
      icon: Calendar,
      trend: null
    },
    {
      title: 'Views',
      value: (kpis?.views || 0).toLocaleString(),
      description: `Last ${horizon}`,
      icon: Eye,
      trend: null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((tile, index) => {
        const Icon = tile.icon;
        const TrendIcon = tile.trend && tile.trend > 0 ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {tile.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tile.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {tile.trend !== null && (
                  <div className={`flex items-center mr-2 ${
                    tile.trend > 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {Math.abs(tile.trend).toFixed(1)}%
                  </div>
                )}
                <span>{tile.description}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Format cents to currency string
 */
function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(dollars);
}
