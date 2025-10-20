import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function EmbeddingStatus() {
  const { toast } = useToast();
  const [status, setStatus] = useState<'checking' | 'ready' | 'missing-key' | 'error'>('checking');
  const [isTriggering, setIsTriggering] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // Check pending embeddings
      const { count } = await supabase
        .from('rocker_knowledge')
        .select('*', { count: 'exact', head: true })
        .is('embedding', null);

      setPendingCount(count || 0);

      // If no pending embeddings, we're ready
      if (!count || count === 0) {
        setStatus('ready');
        return;
      }

      // If there are pending embeddings, assume key might be missing
      // (The worker will process them if the key is configured)
      setStatus('missing-key');
    } catch (error) {
      setStatus('error');
    }
  };

  const triggerEmbedding = async () => {
    setIsTriggering(true);
    try {
      const { error } = await supabase.functions.invoke('generate-embeddings');
      
      if (error) throw error;

      toast({
        title: 'Embedding worker triggered',
        description: 'Processing embeddings... Check back in 2 minutes.',
      });

      setTimeout(checkStatus, 2000);
    } catch (error: any) {
      toast({
        title: 'Failed to trigger embeddings',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsTriggering(false);
    }
  };

  if (status === 'checking') {
    return (
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Checking embedding status...</span>
        </div>
      </Card>
    );
  }

  if (pendingCount === 0) {
    return (
      <Card className="p-4 bg-green-500/10 border-green-500/20">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">All embeddings up to date</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{pendingCount} Embeddings Pending</p>
            <p className="text-sm text-muted-foreground mt-1">
              The embedding worker requires an OpenAI API key to process uploads.
            </p>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <p>To enable embeddings:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Get API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="underline">platform.openai.com</a></li>
                <li>Add to backend: Edge Functions → Secrets → OPENAI_API_KEY</li>
                <li>Worker runs automatically every 2 minutes</li>
              </ol>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={triggerEmbedding}
          disabled={isTriggering}
          className="shrink-0"
        >
          {isTriggering ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1" />
              Trigger Now
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
