import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Loader2, Upload, Brain, CheckSquare } from 'lucide-react';
import { SuperRockerMemory } from '@/components/super-rocker/SuperRockerMemory';
import { SuperRockerTasks } from '@/components/super-rocker/SuperRockerTasks';
import { SuperRockerChat } from '@/components/super-rocker/SuperRockerChat';

export default function SuperRocker() {
  const { session } = useSession();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const handleIngest = async () => {
    if (!text.trim()) {
      toast({ title: 'Please enter some text', variant: 'destructive' });
      return;
    }

    setIsIngesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('rocker-ingest', {
        body: {
          text: text.trim(),
          subject: subject || 'Super Rocker Memory',
          thread_id: threadId
        }
      });

      if (error) throw error;

      setThreadId(data.thread_id);
      toast({
        title: 'Memory Added!',
        description: `Stored ${data.chunks} chunks across ${data.stored} memory entries.`,
      });
      setText('');
    } catch (error: any) {
      console.error('Ingest error:', error);
      toast({
        title: 'Failed to add memory',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      setText(clipText);
      toast({ title: 'Pasted from clipboard' });
    } catch (err) {
      toast({ title: 'Could not read clipboard', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              Super Rocker
            </h1>
            <p className="text-muted-foreground mt-1">
              Mass upload, organize, recall, and act on everything
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Ingest */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Add to Memory</h2>
            </div>
            
            <Input
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <div className="relative">
              <Textarea
                placeholder="Paste your notes, docs, ideas here... (up to 200k+ characters)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {text.length.toLocaleString()} chars
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handlePaste}
                variant="outline"
                className="flex-1"
              >
                Paste
              </Button>
              <Button
                onClick={handleIngest}
                disabled={isIngesting || !text.trim()}
                className="flex-1"
              >
                {isIngesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Add to Memory'
                )}
              </Button>
            </div>
          </Card>

          {/* Center: Chat */}
          <Card className="p-6 lg:col-span-2">
            <SuperRockerChat threadId={threadId} />
          </Card>
        </div>

        {/* Bottom Grid: Memory & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <SuperRockerMemory />
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Tasks</h2>
            </div>
            <SuperRockerTasks threadId={threadId} />
          </Card>
        </div>
      </div>
    </div>
  );
}