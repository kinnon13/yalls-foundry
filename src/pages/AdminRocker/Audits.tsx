/**
 * Admin Rocker - Action Ledger & Audits
 * View action history and audit trails
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AdminAudits() {
  const { data: ledger = [], isLoading } = useQuery({
    queryKey: ['action-ledger'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_action_ledger' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading audit trail...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Action Ledger & Audits</h1>
      <p className="text-muted-foreground mb-6">
        View recent action history, verify outputs, and audit trails.
      </p>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.map((entry: any) => (
              <TableRow key={entry.id}>
                <TableCell className="font-mono text-sm">{entry.topic}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {entry.actor_id?.slice(0, 8)}...
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {entry.target_ref || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={entry.payload?.success ? 'default' : 'destructive'}>
                    {entry.payload?.success !== false ? 'Success' : 'Failed'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(entry.created_at), 'MMM d, HH:mm:ss')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {ledger.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No actions recorded yet.
          </div>
        )}
      </Card>
    </div>
  );
}
