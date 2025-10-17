import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { tokens } from '@/design/tokens';

type Task = {
  id: string; 
  horse_id: string | null; 
  assignee_id: string | null;
  title: string; 
  due_at: string | null; 
  status: 'open'|'in_progress'|'done'|'canceled';
};

export default function Tasks() {
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('tasks').insert({
        title, 
        due_at: dueAt || null, 
        status: 'open', 
        metadata: {},
      });
      if (error) throw error;
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['tasks'] }); 
      setTitle(''); 
      setDueAt(''); 
      toast({ title: 'Task created' }); 
    },
    onError: (e) => toast({ 
      title: 'Create failed', 
      description: (e as Error).message, 
      variant: 'destructive' 
    }),
  });

  const toggle = useMutation({
    mutationFn: async (t: Task) => {
      const next: Task['status'] = t.status === 'done' ? 'open' : 'done';
      const { error } = await (supabase as any)
        .from('tasks')
        .update({ status: next })
        .eq('id', t.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  if (isLoading) return <div style={{ padding: tokens.space.xl }}>Loading tasks…</div>;

  return (
    <div style={{ padding: tokens.space.xl, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: tokens.typography.size.xxl, fontWeight: tokens.typography.weight.bold, marginBottom: tokens.space.l }}>
        Tasks
      </h1>

      <Card style={{ padding: tokens.space.l, marginBottom: tokens.space.l }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: tokens.space.m, alignItems: 'center' }}>
          <Input 
            placeholder="Task title" 
            value={title} 
            onChange={(val) => setTitle(val)} 
          />
          <input 
            type="datetime-local" 
            value={dueAt} 
            onChange={(e) => setDueAt(e.target.value)}
            style={{
              padding: tokens.space.s,
              borderRadius: '6px',
              border: `1px solid hsl(var(--border))`,
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Button 
            variant="primary"
            size="m"
            onClick={() => create.mutate()} 
            disabled={!title || create.isPending}
          >
            {create.isPending ? 'Saving…' : 'Add'}
          </Button>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.m }}>
        {tasks.map((t) => (
          <Card key={t.id} style={{ padding: tokens.space.l }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold }}>
                  {t.title}
                </div>
                <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary, marginTop: tokens.space.xs }}>
                  {t.due_at ? new Date(t.due_at).toLocaleString() : 'No due date'}
                </div>
              </div>
              <Button 
                variant={t.status === 'done' ? 'secondary' : 'primary'} 
                size="m"
                onClick={() => toggle.mutate(t)}
              >
                {t.status === 'done' ? 'Reopen' : 'Mark done'}
              </Button>
            </div>
          </Card>
        ))}

        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: tokens.space.xxl, color: tokens.color.text.secondary }}>
            No tasks yet.
          </div>
        )}
      </div>
    </div>
  );
}
