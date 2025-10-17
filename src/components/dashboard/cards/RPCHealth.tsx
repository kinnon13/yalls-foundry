import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RPCMetric {
  rpc_name: string;
  calls: number;
  error_rate_pct: number;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
}

// SLO thresholds
const P95_THRESHOLD = 250; // ms
const ERROR_RATE_THRESHOLD = 2; // %

export default function RPCHealthCard() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['rpc-slowest', 60],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('rpc_slowest', { 
        p_window_minutes: 60, 
        p_limit: 5 
      });
      if (error) throw error;
      return (data ?? []) as RPCMetric[];
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const getStatusBadge = (metric: RPCMetric) => {
    const p95 = Number(metric.p95_ms);
    const errRate = Number(metric.error_rate_pct);
    
    if (errRate > ERROR_RATE_THRESHOLD) {
      return { color: 'text-destructive', icon: AlertCircle, label: 'High Errors' };
    }
    if (p95 > P95_THRESHOLD) {
      return { color: 'text-orange-500', icon: TrendingUp, label: 'Slow' };
    }
    return { color: 'text-green-500', icon: Activity, label: 'OK' };
  };

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 font-medium text-card-foreground flex items-center gap-2">
          <Activity size={16} />
          RPC Health (last 60m)
        </div>
        <div className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={14} />
          Failed to load metrics
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-medium text-card-foreground flex items-center gap-2">
          <Activity size={16} className="text-primary" />
          RPC Health (last 60m)
        </div>
        {!isLoading && data.length > 0 && (
          <div className="text-xs text-muted-foreground">
            SLO: p95≤{P95_THRESHOLD}ms, err≤{ERROR_RATE_THRESHOLD}%
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No RPC calls tracked yet
        </div>
      ) : (
        <div className="space-y-1">
          {data.map((r) => {
            const status = getStatusBadge(r);
            const StatusIcon = status.icon;
            const p95 = Math.round(Number(r.p95_ms));
            const errRate = Number(r.error_rate_pct).toFixed(1);
            
            return (
              <div
                key={r.rpc_name}
                className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50 transition-colors border-b last:border-0"
                title={`${r.rpc_name}: p50=${Math.round(Number(r.p50_ms))}ms, p95=${p95}ms, p99=${Math.round(Number(r.p99_ms))}ms`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <StatusIcon size={14} className={cn(status.color)} />
                  <span className="truncate font-mono text-xs text-foreground">
                    {r.rpc_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 tabular-nums text-xs">
                  <span className={cn(
                    p95 > P95_THRESHOLD ? 'text-orange-500 font-medium' : 'text-muted-foreground'
                  )}>
                    p95 {p95}ms
                  </span>
                  <span className="text-muted-foreground">
                    {r.calls} calls
                  </span>
                  <span className={cn(
                    Number(errRate) > ERROR_RATE_THRESHOLD ? 'text-destructive font-medium' : 'text-muted-foreground'
                  )}>
                    {errRate}% err
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
