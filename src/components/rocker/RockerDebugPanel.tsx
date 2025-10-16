/**
 * Rocker Debug Panel
 * Detached window showing AI brain activity, learning, and failures
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

interface LearningLog {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  success: boolean;
  message: string;
  screenshot_url?: string;
  selector?: string;
  route: string;
  meta?: any;
}

interface MemoryEntry {
  id: string;
  route: string;
  target_name: string;
  selector: string;
  score: number;
  successes: number;
  failures: number;
  last_success_at?: string;
  last_attempt_at: string;
}

export function RockerDebugPanel({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<LearningLog[]>([]);
  const [memory, setMemory] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Real-time subscription to learning logs
    const channel = supabase
      .channel('rocker-debug')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_feedback',
          filter: `user_id=eq.${userId}`,
        },
        () => loadData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_selector_memory',
          filter: `user_id=eq.${userId}`,
        },
        () => loadMemory()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const loadData = async () => {
    await Promise.all([loadLogs(), loadMemory()]);
    setLoading(false);
  };

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from('ai_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setLogs(
        data.map((row) => ({
          id: row.id,
          timestamp: row.created_at,
          action: row.action || 'unknown',
          target: row.target || 'unknown',
          success: row.success,
          message: row.message || '',
          screenshot_url: row.screenshot_url,
          selector: row.selector,
          route: row.route || '/',
          meta: row.meta,
        }))
      );
    }
  };

  const loadMemory = async () => {
    const { data, error } = await supabase
      .from('ai_selector_memory')
      .select('*')
      .eq('user_id', userId)
      .order('last_attempt_at', { ascending: false });

    if (!error && data) {
      setMemory(data as MemoryEntry[]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Loading Rocker's brain...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background p-4 overflow-hidden">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">🤖 Rocker Debug Panel</h1>
        <p className="text-sm text-muted-foreground">
          Real-time view of AI learning, memory, and interactions
        </p>
      </div>

      <Tabs defaultValue="logs" className="h-[calc(100vh-120px)]">
        <TabsList>
          <TabsTrigger value="logs">Learning Logs</TabsTrigger>
          <TabsTrigger value="memory">Memory ({memory.length})</TabsTrigger>
          <TabsTrigger value="failures">Failures Only</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="h-full">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              {logs.map((log) => (
                <Card key={log.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={log.success ? 'default' : 'destructive'}>
                          {log.success ? '✓' : '✗'} {log.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm font-medium truncate">
                        Target: {log.target}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {log.message}
                      </div>
                      {log.selector && (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 block truncate">
                          {log.selector}
                        </code>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        Route: {log.route}
                      </div>
                    </div>
                    {log.screenshot_url && (
                      <a
                        href={log.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <img
                          src={log.screenshot_url}
                          alt="Screenshot"
                          className="w-20 h-20 object-cover rounded border border-border hover:scale-150 transition-transform cursor-pointer"
                        />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="memory" className="h-full">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              {memory.map((entry) => (
                <Card key={entry.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{entry.target_name}</span>
                    <Badge variant="outline">
                      Score: {(entry.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <code className="text-xs bg-muted px-2 py-1 rounded block mb-2 overflow-x-auto">
                    {entry.selector}
                  </code>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Route: {entry.route}</div>
                    <div>
                      Success: {entry.successes} | Failures: {entry.failures}
                    </div>
                    {entry.last_success_at && (
                      <div>
                        Last success:{' '}
                        {new Date(entry.last_success_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="failures" className="h-full">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              {logs
                .filter((log) => !log.success)
                .map((log) => (
                  <Card key={log.id} className="p-3 border-destructive/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive">✗ {log.action}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm font-medium truncate">
                          Target: {log.target}
                        </div>
                        <div className="text-xs text-destructive mt-1">
                          {log.message}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Route: {log.route}
                        </div>
                      </div>
                      {log.screenshot_url && (
                        <a
                          href={log.screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                        >
                          <img
                            src={log.screenshot_url}
                            alt="Failure screenshot"
                            className="w-24 h-24 object-cover rounded border-2 border-destructive hover:scale-150 transition-transform cursor-pointer"
                          />
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
