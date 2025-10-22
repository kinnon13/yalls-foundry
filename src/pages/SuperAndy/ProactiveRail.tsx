import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProactiveRail() {
  const { data: items = [], refetch } = useQuery({
    queryKey: ['proactive'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_proactive_suggestions' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
    refetchInterval: 10000
  });

  async function accept(id: string) {
    await supabase
      .from('ai_proactive_suggestions' as any)
      .update({ status: 'accepted' })
      .eq('id', id);
    refetch();
  }

  async function reject(id: string) {
    await supabase
      .from('ai_proactive_suggestions' as any)
      .update({ status: 'rejected' })
      .eq('id', id);
    refetch();
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold mb-2">Proactive Suggestions</h3>
      {items.map((p: any) => (
        <Card key={p.id} className="p-3 space-y-1">
          <div className="text-sm font-medium">{p.title}</div>
          <div className="text-xs opacity-70">{p.summary}</div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => accept(p.id)}>Accept</Button>
            <Button size="sm" variant="secondary" onClick={() => reject(p.id)}>Reject</Button>
          </div>
        </Card>
      ))}
      {items.length === 0 && (
        <div className="text-xs opacity-60">No proactive suggestions yet.</div>
      )}
    </div>
  );
}
