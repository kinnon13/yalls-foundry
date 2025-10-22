import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SuperOverview() {
  const { data: health } = useQuery({
    queryKey: ['ai-health'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('ai_health');
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: counts = [] } = useQuery({
    queryKey: ['jobs', 'counts'],
    queryFn: async () => {
      const { data } = await supabase.rpc('job_status_counts');
      return data || [];
    },
    refetchInterval: 3000,
  });

  const countsByStatus = Object.fromEntries(
    counts.map((r: any) => [r.status, Number(r.count)])
  );
  const queuedCount = countsByStatus.queued || 0;
  const runningCount = countsByStatus.running || 0;

  const { data: dlq } = useQuery({
    queryKey: ['dlq'],
    queryFn: async () => {
      const { data, count } = await supabase
        .from('ai_job_dlq')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
    refetchInterval: 5000,
  });

  const { data: heartbeats = [] } = useQuery({
    queryKey: ['heartbeats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_worker_heartbeats')
        .select('*')
        .order('last_beat', { ascending: false });
      return data || [];
    },
    refetchInterval: 5000,
  });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Super Console</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6" data-testid="health-card">
          <h3 className="font-semibold mb-2">System Health</h3>
          <p className={`text-2xl font-bold ${health?.status === 'ok' ? 'text-green-500' : 'text-yellow-500'}`}>
            {health?.status?.toUpperCase() || 'LOADING'}
          </p>
          <p className="text-sm text-muted-foreground">
            {health?.total_latency_ms || 0}ms latency
          </p>
        </Card>

        <Card className="p-6" data-testid="queue-card">
          <h3 className="font-semibold mb-2">Queue Depth</h3>
          <p className="text-2xl font-bold">{queuedCount}</p>
          <p className="text-sm text-muted-foreground">
            {runningCount} running
          </p>
        </Card>

        <Card className="p-6" data-testid="dlq-card">
          <h3 className="font-semibold mb-2">Dead Letter Queue</h3>
          <p className="text-2xl font-bold">{dlq}</p>
        </Card>

        <Card className="p-6" data-testid="workers-heatmap">
          <h3 className="font-semibold mb-2">Active Workers</h3>
          <p className="text-2xl font-bold">{heartbeats.length}</p>
          <p className="text-sm text-muted-foreground">
            {heartbeats.filter(h => {
              const age = Date.now() - new Date(h.last_beat).getTime();
              return age < 30000;
            }).length} healthy
          </p>
        </Card>
      </div>
    </div>
  );
}
