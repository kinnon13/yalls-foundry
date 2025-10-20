import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, CheckCircle2, Circle, Clock, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  status: 'open' | 'doing' | 'blocked' | 'done' | 'cancelled';
  due_at: string | null;
  created_at: string;
}

export function SuperRockerTasks({ threadId }: { threadId: string | null }) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('rocker-tasks', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setTasks(data.tasks || []);
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('rocker-tasks', {
        body: {
          action: 'create',
          title: newTaskTitle.trim(),
          thread_id: threadId
        }
      });

      if (error) throw error;
      setNewTaskTitle('');
      await loadTasks();
      toast({ title: 'Task created' });
    } catch (error: any) {
      toast({
        title: 'Failed to create task',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'open' : 'done';

    try {
      const { error } = await supabase.functions.invoke('rocker-tasks', {
        body: {
          action: 'update',
          task_id: taskId,
          status: newStatus
        }
      });

      if (error) throw error;
      await loadTasks();
    } catch (error: any) {
      toast({
        title: 'Failed to update task',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('rocker_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      await loadTasks();
      toast({ title: 'Task deleted' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete task',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const bulkDelete = async () => {
    if (selectedTasks.size === 0) return;

    try {
      const { error } = await supabase
        .from('rocker_tasks')
        .delete()
        .in('id', Array.from(selectedTasks));

      if (error) throw error;
      setSelectedTasks(new Set());
      await loadTasks();
      toast({ title: `Deleted ${selectedTasks.size} tasks` });
    } catch (error: any) {
      toast({
        title: 'Failed to delete tasks',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleSelect = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const openTasks = tasks.filter(t => t.status === 'open' || t.status === 'doing');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="New task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') createTask();
          }}
        />
        <Button
          onClick={createTask}
          disabled={isCreating || !newTaskTitle.trim()}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {selectedTasks.size > 0 && (
        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <span className="text-sm">{selectedTasks.size} selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={bulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <ScrollArea className="h-[350px]">
        <div className="space-y-4 pr-4">
          {openTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Open ({openTasks.length})
              </h3>
              <div className="space-y-2">
                {openTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-2 p-2 border rounded-lg hover:bg-accent/50 transition-colors ${
                      selectedTasks.has(task.id) ? 'bg-accent border-primary' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={() => toggleSelect(task.id)}
                      className="mt-2 cursor-pointer"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0 mt-1"
                      onClick={() => toggleStatus(task.id, task.status)}
                    >
                      <Circle className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{task.title}</p>
                      {task.due_at && (
                        <p className="text-xs text-muted-foreground">
                          Due: {format(new Date(task.due_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => deleteTask(task.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {doneTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Done ({doneTasks.length})
              </h3>
              <div className="space-y-2">
                {doneTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 p-2 border rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0 mt-1"
                      onClick={() => toggleStatus(task.id, task.status)}
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </Button>
                    <p className="text-sm line-through flex-1">{task.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>No tasks yet</p>
              <p className="text-xs mt-1">Type "todo:" in chat to auto-create</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}