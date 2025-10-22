import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SelfImproveLog() {
  const { data: rows = [], refetch } = useQuery({
    queryKey: ['selfimprove'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_self_improve_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      return data ?? [];
    },
    refetchInterval: 15000
  });

  async function runSelfImprove() {
    try {
      await supabase.functions.invoke('self_improve_tick', { body: {} });
      toast.success('Self-improve triggered');
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      toast.error('Failed to trigger');
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Self-Improvement Log</h3>
        <Button size="sm" variant="secondary" onClick={runSelfImprove}>Run Now</Button>
      </div>
      {rows.map((r: any) => (
        <Card key={r.id} className="p-3 space-y-2">
          <div className="text-sm font-medium">{r.change_type}</div>
          <div className="text-xs opacity-70">{r.rationale}</div>
          {(r.before || r.after) && (
            <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify({ before: r.before, after: r.after }, null, 2)}
            </pre>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(r.created_at).toLocaleString()}
          </div>
        </Card>
      ))}
      {rows.length === 0 && (
        <div className="text-xs opacity-60">No changes yet.</div>
      )}
    </div>
  );
}
