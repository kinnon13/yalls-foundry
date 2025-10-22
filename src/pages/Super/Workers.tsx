import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Heartbeat = {
  worker_id: string;
  pool: string;
  last_beat: string;
  load_pct: number;
  version: string;
};

export default function WorkersPage() {
  const { data: heartbeats = [] } = useQuery({
    queryKey: ['heartbeats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_worker_heartbeats')
        .select('*')
        .order('last_beat', { ascending: false })
        .limit(200);
      return data as Heartbeat[];
    },
    refetchInterval: 5000,
  });

  const probe = useMutation({
    mutationFn: async (workerId: string) => {
      const { data } = await supabase.functions.invoke('ai_eventbus', {
        body: {
          tenantId: null,
          region: 'us',
          topic: 'ops.incident_probe',
          payload: { worker_id: workerId }
        }
      });
      return data;
    },
    onSuccess: () => toast.success('Probe enqueued'),
  });

  const getStatus = (lastBeat: string) => {
    const age = Date.now() - new Date(lastBeat).getTime();
    return age > 30000 ? 'STALE' : 'OK';
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Active Workers</h1>
      
      <Table data-testid="workers-table">
        <TableHeader>
          <TableRow>
            <TableHead>Worker ID</TableHead>
            <TableHead>Pool</TableHead>
            <TableHead>Last Beat</TableHead>
            <TableHead>Load %</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {heartbeats.map((hb) => {
            const status = getStatus(hb.last_beat);
            const age = Math.floor((Date.now() - new Date(hb.last_beat).getTime()) / 1000);
            return (
              <TableRow key={hb.worker_id} className={status === 'STALE' ? 'bg-destructive/10' : ''}>
                <TableCell className="font-mono text-xs">{hb.worker_id}</TableCell>
                <TableCell>{hb.pool}</TableCell>
                <TableCell>{age}s ago</TableCell>
                <TableCell>{hb.load_pct}%</TableCell>
                <TableCell className="text-xs">{hb.version}</TableCell>
                <TableCell>
                  <Badge variant={status === 'OK' ? 'default' : 'destructive'}>
                    {status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    data-testid="probe-worker"
                    size="sm"
                    variant="outline"
                    onClick={() => probe.mutate(hb.worker_id)}
                  >
                    Probe
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {heartbeats.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No active workers. Watchdog will alert if this persists.
        </p>
      )}
    </div>
  );
}
