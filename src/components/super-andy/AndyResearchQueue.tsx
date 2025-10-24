/**
 * Andy Research Queue - Manage topics for Andy to research
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Play, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ResearchItem {
  id: string;
  topic: string;
  query: string;
  status: 'pending' | 'researching' | 'completed' | 'failed';
  priority: number;
  findings: string | null;
  sources: any;
  created_at: string;
  completed_at: string | null;
  collection?: { name: string; color: string };
}

export function AndyResearchQueue() {
  const [queue, setQueue] = useState<ResearchItem[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [newQuery, setNewQuery] = useState('');
  const [newPriority, setNewPriority] = useState('5');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    
    // Real-time updates
    const channel = supabase
      .channel('research-queue')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'andy_research_queue'
      }, () => {
        loadQueue();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('andy_research_queue')
        .select(`
          *,
          collection:collection_id(name, color)
        `)
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueue(data || []);
    } catch (error) {
      console.error('Failed to load research queue:', error);
      toast.error('Failed to load research queue');
    } finally {
      setLoading(false);
    }
  };

  const addToQueue = async () => {
    if (!newTopic.trim() || !newQuery.trim()) {
      toast.error('Topic and query required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from('andy_research_queue')
        .insert({
          user_id: user.id,
          topic: newTopic,
          query: newQuery,
          priority: parseInt(newPriority)
        });

      if (error) throw error;

      toast.success('Added to research queue');
      setNewTopic('');
      setNewQuery('');
      setNewPriority('5');
      loadQueue();
    } catch (error) {
      console.error('Failed to add to queue:', error);
      toast.error('Failed to add to queue');
    }
  };

  const triggerResearch = async (id: string, query: string) => {
    try {
      // Update status to researching
      await (supabase as any)
        .from('andy_research_queue')
        .update({ status: 'researching' })
        .eq('id', id);

      toast.info('Research started...');

      // Call web search function
      const { data, error } = await supabase.functions.invoke('super-andy-web-search', {
        body: { query }
      });

      if (error) throw error;

      // Update with findings
      await (supabase as any)
        .from('andy_research_queue')
        .update({
          status: 'completed',
          findings: data.analysis,
          sources: data.results,
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      toast.success('Research completed');
      loadQueue();
    } catch (error) {
      console.error('Research failed:', error);
      await (supabase as any)
        .from('andy_research_queue')
        .update({ status: 'failed' })
        .eq('id', id);
      toast.error('Research failed');
      loadQueue();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'researching':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Search className="w-4 h-4" />
          Research Queue ({queue.length})
        </h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              Add Research
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Research Queue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Topic (e.g., AI Safety)"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
              />
              <Textarea
                placeholder="Research query (what should Andy search for?)"
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-2">
                <label className="text-sm">Priority:</label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                      <SelectItem key={p} value={p.toString()}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addToQueue} className="w-full">
                Add to Queue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {queue.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No research items yet
            </p>
          )}
          {queue.map((item) => (
            <Card key={item.id} className="p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className="font-medium">{item.topic}</p>
                    <p className="text-xs text-muted-foreground">{item.query}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">P{item.priority}</Badge>
                  {item.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => triggerResearch(item.id, item.query)}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {item.findings && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs font-medium mb-1">Findings:</p>
                  <p className="text-xs text-muted-foreground">{item.findings.slice(0, 200)}...</p>
                  {item.sources && Array.isArray(item.sources) && item.sources.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Sources:</p>
                      <div className="space-y-1">
                        {item.sources.slice(0, 3).map((src: any, idx: number) => (
                          <a
                            key={idx}
                            href={src.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-500 hover:underline truncate"
                          >
                            {src.title || src.link}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
