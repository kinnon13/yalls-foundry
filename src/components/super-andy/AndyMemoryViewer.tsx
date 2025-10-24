/**
 * Andy Memory Viewer - Real-time Memory Display
 * Shows all memories with file export and real-time updates
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Download, RefreshCw, Brain, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Memory {
  id: string;
  content: string;
  memory_type: string;
  score: number;
  created_at: string;
  metadata?: any;
}

export function AndyMemoryViewer() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
    
    // Real-time subscription
    const channel = supabase
      .channel('andy-memories')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_user_memory'
      }, () => {
        loadMemories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMemories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('ai_user_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Failed to load memories:', error);
      toast.error('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  const exportMemories = () => {
    const data = memories.map(m => ({
      type: m.memory_type,
      content: m.content,
      score: m.score,
      created: new Date(m.created_at).toLocaleString(),
      metadata: m.metadata
    }));

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `andy-memories-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Memories exported');
  };

  const filteredMemories = memories.filter(m => 
    m.content.toLowerCase().includes(search.toLowerCase()) ||
    m.memory_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Andy's Memories ({memories.length})
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadMemories} disabled={loading}>
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" variant="outline" onClick={exportMemories}>
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredMemories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? 'No memories match search' : 'No memories yet'}
            </p>
          )}
          {filteredMemories.map((mem) => (
            <Card key={mem.id} className="p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {mem.memory_type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(mem.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm">{mem.content}</p>
              {mem.metadata && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Metadata
                  </summary>
                  <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                    {JSON.stringify(mem.metadata, null, 2)}
                  </pre>
                </details>
              )}
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${mem.score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {(mem.score * 100).toFixed(0)}%
                </span>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
