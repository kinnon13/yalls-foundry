import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RPCMetric {
  rpc_name: string;
  calls: number;
  error_rate_pct: number;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
}

export default function RPCHealthCard() {
  const { data = [], isLoading } = useQuery({
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

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 font-medium text-card-foreground">RPC Health (last 60m)</div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : data.length === 0 ? (
        <div className="text-sm text-muted-foreground">No data yet</div>
      ) : (
        <div className="space-y-1 text-sm">
          {data.map((r) => (
            <div key={r.rpc_name} className="flex items-center justify-between py-1 border-b last:border-0">
              <div className="truncate max-w-[50%] text-foreground font-mono text-xs">{r.rpc_name}</div>
              <div className="tabular-nums text-muted-foreground text-xs">
                p95 {Math.round(Number(r.p95_ms))}ms • {r.calls} calls • {Number(r.error_rate_pct).toFixed(1)}% errs
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
