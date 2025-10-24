import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Brain, Book, Check, FileText, Activity, Zap } from 'lucide-react';

interface ThoughtEvent {
  type: 'lookup' | 'result' | 'complete' | 'error';
  data: any;
  timestamp: string;
}

const iconMap: Record<string, any> = {
  brain: Brain,
  book: Book,
  check: Check,
  note: FileText,
  activity: Activity,
};

export function AndyThoughtStream({ userId }: { userId: string }) {
  const [events, setEvents] = useState<ThoughtEvent[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const connectStream = () => {
      setIsLive(true);
      const eventSource = new EventSource(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/andy-thought-stream?user_id=${userId}`,
        {
          // @ts-ignore - EventSource options
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          }
        }
      );

      eventSource.addEventListener('lookup', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setEvents(prev => [...prev, {
          type: 'lookup',
          data,
          timestamp: new Date().toISOString()
        }]);
      });

      eventSource.addEventListener('result', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setEvents(prev => [...prev, {
          type: 'result',
          data,
          timestamp: new Date().toISOString()
        }]);
      });

      eventSource.addEventListener('complete', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setEvents(prev => [...prev, {
          type: 'complete',
          data,
          timestamp: new Date().toISOString()
        }]);
        setIsLive(false);
      });

      eventSource.addEventListener('error', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setEvents(prev => [...prev, {
          type: 'error',
          data,
          timestamp: new Date().toISOString()
        }]);
        setIsLive(false);
      });

      eventSource.onerror = () => {
        eventSource.close();
        setIsLive(false);
      };

      return () => eventSource.close();
    };

    const cleanup = connectStream();

    // Reconnect every 30 seconds for live updates
    const interval = setInterval(() => {
      setEvents([]); // Clear old events
      cleanup();
      connectStream();
    }, 30000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [userId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Andy's Thought Stream
        </h3>
        {isLive && (
          <Badge variant="outline" className="animate-pulse">
            <Zap className="h-3 w-3 mr-1" />
            LIVE
          </Badge>
        )}
      </div>

      <ScrollArea className="h-[400px] rounded-lg border bg-black/50 p-3">
        <div className="space-y-2 font-mono text-xs">
          {events.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Waiting for brain activity...
            </p>
          )}

          {events.map((event, i) => {
            const timestamp = new Date(event.timestamp).toLocaleTimeString();

            if (event.type === 'lookup') {
              const Icon = iconMap[event.data.icon] || Activity;
              return (
                <div key={i} className="flex items-start gap-2 text-cyan-400">
                  <span className="opacity-50">{timestamp}</span>
                  <Icon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{event.data.source}</span>
                  <span className="opacity-70">→</span>
                  <span className="opacity-90">{event.data.action}</span>
                </div>
              );
            }

            if (event.type === 'result') {
              return (
                <div key={i} className="flex items-start gap-2 text-green-400 ml-4">
                  <span className="opacity-50">{timestamp}</span>
                  <span>✅</span>
                  <span>{event.data.source}</span>
                  <span className="opacity-70">→</span>
                  <span className="opacity-90">
                    {event.data.count !== undefined && `${event.data.count} items`}
                    {event.data.preview && ` (${event.data.preview})`}
                    {event.data.success_rate && ` ${event.data.success_rate} success`}
                  </span>
                </div>
              );
            }

            if (event.type === 'complete') {
              return (
                <div key={i} className="flex items-start gap-2 text-purple-400 border-t pt-2 mt-2">
                  <span className="opacity-50">{timestamp}</span>
                  <span>🎯</span>
                  <span>Summary:</span>
                  <span className="opacity-90">
                    {Object.entries(event.data.summary)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(', ')}
                  </span>
                </div>
              );
            }

            if (event.type === 'error') {
              return (
                <div key={i} className="flex items-start gap-2 text-red-400">
                  <span className="opacity-50">{timestamp}</span>
                  <span>❌</span>
                  <span>Error:</span>
                  <span className="opacity-90">{event.data.message}</span>
                </div>
              );
            }

            return null;
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
