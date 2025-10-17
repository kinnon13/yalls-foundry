import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

type Task = {
  id: string;
  subject: string;
  status: 'open' | 'done' | 'cancelled';
  due_at: string | null;
  owner_user_id: string;
  related_entity_id: string | null;
  created_at: string;
  updated_at: string;
};

export default function Tasks() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const add = useMutation({
    mutationFn: async (t: { subject: string; due_at?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      const { error } = await supabase.from('tasks').insert({
        subject: t.subject,
        due_at: t.due_at || null,
        status: 'open' as const,
        owner_user_id: userData.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle('');
      setDueDate('');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task added' });
    },
    onError: (e) => toast({
      title: 'Failed to add task',
      description: String(e),
      variant: 'destructive',
    }),
  });

  const toggleDone = useMutation({
    mutationFn: async (id: string) => {
      const task = tasks.find(t => t.id === id);
      const newStatus = task?.status === 'done' ? 'open' : 'done';
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  if (isLoading) return <div className="p-6">Loading tasks...</div>;

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="New task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && title) {
                add.mutate({ subject: title, due_at: dueDate || undefined });
              }
            }}
            className="flex-1"
          />
          <Input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-64"
          />
          <Button
            disabled={!title || add.isPending}
            onClick={() => add.mutate({ subject: title, due_at: dueDate || undefined })}
          >
            {add.isPending ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {tasks.map(t => (
          <Card key={t.id} className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Checkbox
                  checked={t.status === 'done'}
                  onCheckedChange={() => toggleDone.mutate(t.id)}
                />
                <div className={t.status === 'done' ? 'line-through opacity-60' : ''}>
                  <div className="font-medium">{t.subject}</div>
                  {t.due_at && (
                    <div className="text-sm text-muted-foreground">
                      Due {new Date(t.due_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No tasks yet. Add one above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
