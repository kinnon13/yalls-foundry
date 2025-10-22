import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

export default function SelfImproveLog() {
  const { data: rows = [] } = useQuery({
    queryKey: ['selfimprove'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_self_improve_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      return data ?? [];
    },
    refetchInterval: 15000
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold mb-2">Self-Improvement Log</h3>
      {rows.map((r: any) => (
        <Card key={r.id} className="p-3">
          <div className="text-sm font-medium">{r.change_type}</div>
          <div className="text-xs opacity-70">{r.rationale}</div>
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
