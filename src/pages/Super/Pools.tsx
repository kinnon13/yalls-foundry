import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

type PoolRow = {
  pool: string;
  min_concurrency: number;
  max_concurrency: number;
  burst_concurrency: number;
  current_concurrency: number;
  topic_glob: string;
  updated_at: string;
};

export default function PoolsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Record<string, number>>({});

  const { data: pools = [] } = useQuery({
    queryKey: ['pools'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_worker_pools')
        .select('*')
        .order('pool');
      return data as PoolRow[];
    },
  });

  const updatePool = useMutation({
    mutationFn: async ({ pool, current }: { pool: string; current: number }) => {
      const { data } = await supabase.functions.invoke('ai_control', {
        body: {
          action: 'pool',
          pool: { pool, set: { current_concurrency: current } }
        }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      toast.success('Pool updated');
      setEditing({});
    },
  });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Worker Pools</h1>
      
      <Table data-testid="pools-table">
        <TableHeader>
          <TableRow>
            <TableHead>Pool</TableHead>
            <TableHead>Min</TableHead>
            <TableHead>Max</TableHead>
            <TableHead>Burst</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>Topic Glob</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pools.map((pool) => (
            <TableRow key={pool.pool}>
              <TableCell className="font-medium">{pool.pool}</TableCell>
              <TableCell>{pool.min_concurrency}</TableCell>
              <TableCell>{pool.max_concurrency}</TableCell>
              <TableCell>{pool.burst_concurrency}</TableCell>
              <TableCell>
                <Input
                  data-testid="pool-edit-current"
                  type="number"
                  value={editing[pool.pool] ?? pool.current_concurrency}
                  onChange={(e) => setEditing({
                    ...editing,
                    [pool.pool]: parseInt(e.target.value)
                  })}
                  className="w-20"
                />
              </TableCell>
              <TableCell className="font-mono text-xs">{pool.topic_glob}</TableCell>
              <TableCell>
                {editing[pool.pool] !== undefined && (
                  <Button
                    data-testid="pool-apply"
                    size="sm"
                    onClick={() => updatePool.mutate({
                      pool: pool.pool,
                      current: editing[pool.pool]
                    })}
                  >
                    Apply
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
