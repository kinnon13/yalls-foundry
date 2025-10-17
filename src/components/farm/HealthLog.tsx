import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { tokens } from '@/design/tokens';

type Entry = { 
  id: string; 
  horse_id: string; 
  kind: string; 
  note: string | null; 
  metrics: Record<string, unknown>; 
  created_at: string;
};

export default function HealthLog({ horseId }: { horseId: string }) {
  const [kind, setKind] = useState('vitals');
  const [note, setNote] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['health-log', horseId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('horse_health_log')
        .select('*')
        .eq('horse_id', horseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Entry[];
    },
    enabled: !!horseId,
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { error } = await (supabase as any).from('horse_health_log').insert({
        horse_id: horseId, 
        kind, 
        note: note || null, 
        metrics: {}, 
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['health-log', horseId] }); 
      setNote(''); 
      toast({ title: 'Log added' }); 
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.m }}>
      <Card style={{ padding: tokens.space.l }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: tokens.space.m, alignItems: 'center' }}>
          <Input 
            value={kind} 
            onChange={(val) => setKind(val)} 
            placeholder="Kind (vitals, treatment…)" 
          />
          <Input 
            value={note} 
            onChange={(val) => setNote(val)} 
            placeholder="Note (optional)" 
          />
          <Button 
            variant="primary"
            size="m"
            onClick={() => add.mutate()} 
            disabled={!kind || add.isPending}
          >
            {add.isPending ? 'Saving…' : 'Add'}
          </Button>
        </div>
      </Card>

      {entries.map((e) => (
        <Card key={e.id} style={{ padding: tokens.space.l }}>
          <div style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold }}>
            {e.kind}
          </div>
          {e.note && (
            <div style={{ fontSize: tokens.typography.size.m, marginTop: tokens.space.s }}>
              {e.note}
            </div>
          )}
          <div style={{ fontSize: tokens.typography.size.xs, color: tokens.color.text.secondary, marginTop: tokens.space.m }}>
            {new Date(e.created_at).toLocaleString()}
          </div>
        </Card>
      ))}

      {entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: tokens.space.xl, color: tokens.color.text.secondary }}>
          No health entries yet.
        </div>
      )}
    </div>
  );
}
