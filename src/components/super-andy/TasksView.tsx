import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Trash2,
  ListTodo,
  Calendar
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  kind: string;
  due_at?: string;
  subtasks?: any[];
  created_at: string;
}

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('andy-task-os', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast({
        title: "Error loading tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const { error } = await supabase.functions.invoke('andy-task-os', {
        body: {
          action: 'create',
          task: {
            title: newTaskTitle,
            status: 'inbox',
            priority: 'normal',
            kind: 'action',
          }
        }
      });

      if (error) throw error;

      setNewTaskTitle("");
      await loadTasks();
      
      toast({
        title: "Task created",
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      toast({
        title: "Error creating task",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase.functions.invoke('andy-task-os', {
        body: {
          action: 'update',
          task_id: taskId,
          task: { status: newStatus }
        }
      });

      if (error) throw error;
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.functions.invoke('andy-task-os', {
        body: {
          action: 'delete',
          task_id: taskId
        }
      });

      if (error) throw error;
      await loadTasks();
      
      toast({
        title: "Task deleted",
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const triageTasks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('andy-task-os', {
        body: { action: 'triage' }
      });

      if (error) throw error;
      
      toast({
        title: `Triaged ${data.triaged} tasks`,
      });
      
      await loadTasks();
    } catch (error) {
      console.error('Failed to triage:', error);
    }
  };

  const filterTasks = (status: string) => {
    if (status === "all") return tasks;
    return tasks.filter(t => t.status === status);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'low': return <Circle className="w-4 h-4 text-gray-400" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <Circle className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'blocked': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>;
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Tasks</h1>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <Button onClick={triageTasks} variant="outline" size="sm">
          Auto-Triage Inbox
        </Button>
      </div>

      {/* New Task Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createTask()}
        />
        <Button onClick={createTask} size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="inbox">Inbox ({filterTasks('inbox').length})</TabsTrigger>
          <TabsTrigger value="triaged">Triaged ({filterTasks('triaged').length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({filterTasks('in_progress').length})</TabsTrigger>
          <TabsTrigger value="done">Done ({filterTasks('done').length})</TabsTrigger>
          <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="flex-1 mt-4">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-2 pr-4">
              {filterTasks(activeTab).map((task) => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <h3 className="font-medium">{task.title}</h3>
                        {getPriorityIcon(task.priority)}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {task.kind}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                        {task.due_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {task.subtasks.filter((st: any) => st.done).length} / {task.subtasks.length} subtasks completed
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1">
                      {task.status !== 'done' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'done')}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filterTasks(activeTab).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No tasks in {activeTab}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
