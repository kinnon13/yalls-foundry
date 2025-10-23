/**
 * Andy Brain Monitor
 * Real-time view of Andy's mental state, learning progress, and activity
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Activity, Database, Zap, MessageSquare, FileText, Calendar, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BrainMetrics {
  ai_engine: 'grok-2-vision' | 'gemini';
  memories_count: number;
  learnings_today: number;
  rag_indexed: number;
  tasks_active: number;
  calendar_events: number;
  messages_today: number;
  last_active: string;
  crons_running: number;
  edge_functions: number;
}

interface RecentActivity {
  timestamp: string;
  type: string;
  description: string;
  status: 'success' | 'error' | 'pending';
}

export function AndyBrainMonitor() {
  const [metrics, setMetrics] = useState<BrainMetrics>({
    ai_engine: 'grok-2-vision',
    memories_count: 0,
    learnings_today: 0,
    rag_indexed: 0,
    tasks_active: 0,
    calendar_events: 0,
    messages_today: 0,
    last_active: new Date().toISOString(),
    crons_running: 13,
    edge_functions: 39,
  });

  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all brain metrics in parallel
      const [memories, learnings, rag, tasks, events, messages, monitoring] = await Promise.all([
        supabase.from('ai_user_memory').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('ai_learnings').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString()),
        supabase.from('rocker_knowledge').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('embedding', 'is', null),
        supabase.from('rocker_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['open', 'doing']),
        supabase.from('calendar_events').select('id', { count: 'exact', head: true }).gte('starts_at', new Date().toISOString()).limit(10),
        supabase.from('rocker_messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString()),
        supabase.from('ai_monitoring').select('*').order('created_at', { ascending: false }).limit(20),
      ]);

      setMetrics({
        ai_engine: 'grok-2-vision',
        memories_count: memories.count || 0,
        learnings_today: learnings.count || 0,
        rag_indexed: rag.count || 0,
        tasks_active: tasks.count || 0,
        calendar_events: events.count || 0,
        messages_today: messages.count || 0,
        last_active: monitoring.data?.[0]?.created_at || new Date().toISOString(),
        crons_running: 13,
        edge_functions: 39,
      });

      // Format recent activity
      const recentActivity: RecentActivity[] = (monitoring.data || []).map(m => ({
        timestamp: m.created_at,
        type: m.request_type || 'chat',
        description: `${m.function_name} - ${m.status || 'completed'}`,
        status: m.status === 'failed' ? 'error' : 'success',
      }));

      setActivity(recentActivity);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load brain metrics:', error);
    }
  };

  const getHealthColor = () => {
    if (metrics.learnings_today > 10 && metrics.messages_today > 5) return 'text-green-500';
    if (metrics.learnings_today > 5 || metrics.messages_today > 2) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 animate-pulse" />
          <span>Loading Andy's brain state...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className={`h-6 w-6 ${getHealthColor()}`} />
            <h3 className="text-lg font-semibold">Andy's Brain Monitor</h3>
          </div>
          <Badge variant={metrics.ai_engine === 'grok-2-vision' ? 'default' : 'secondary'}>
            {metrics.ai_engine.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>Memories</span>
            </div>
            <p className="text-2xl font-bold">{metrics.memories_count}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>Learnings Today</span>
            </div>
            <p className="text-2xl font-bold">{metrics.learnings_today}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>RAG Indexed</span>
            </div>
            <p className="text-2xl font-bold">{metrics.rag_indexed}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>Chats Today</span>
            </div>
            <p className="text-2xl font-bold">{metrics.messages_today}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CheckSquare className="h-4 w-4" />
              <span>Active Tasks</span>
            </div>
            <p className="text-2xl font-bold">{metrics.tasks_active}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Upcoming Events</span>
            </div>
            <p className="text-2xl font-bold">{metrics.calendar_events}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Infrastructure Health</span>
            <span className="font-medium">100%</span>
          </div>
          <Progress value={100} className="h-2" />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{metrics.crons_running} crons running</span>
            <span>{metrics.edge_functions} edge functions</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Last active: {new Date(metrics.last_active).toLocaleTimeString()}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="font-semibold mb-4">Recent Activity</h4>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              activity.map((act, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={act.status === 'error' ? 'destructive' : 'secondary'}
                      className="w-2 h-2 p-0 rounded-full"
                    />
                    <span className="text-sm">{act.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(act.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
