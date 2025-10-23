import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { callEdge } from '@/lib/edge/callEdge';

export function AndyAdminPanel() {
  const [loading, setLoading] = useState<string | null>(null);

  const triggerFunction = async (functionName: string, displayName: string) => {
    setLoading(functionName);
    try {
      await callEdge(functionName, {});
      toast.success(`${displayName} triggered successfully`);
    } catch (error) {
      toast.error(`Failed to trigger ${displayName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Andy Learning Controls
        </CardTitle>
        <CardDescription>
          Manually trigger Andy's learning and memory processing functions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={() => triggerFunction('andy-auto-analyze', 'Auto Analyze')}
          disabled={loading !== null}
          className="w-full justify-start"
          variant="outline"
        >
          {loading === 'andy-auto-analyze' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Run Hourly Analysis
          <span className="ml-auto text-xs text-muted-foreground">
            Perceive & analyze recent events
          </span>
        </Button>

        <Button
          onClick={() => triggerFunction('andy-expand-memory', 'Expand Memory')}
          disabled={loading !== null}
          className="w-full justify-start"
          variant="outline"
        >
          {loading === 'andy-expand-memory' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Brain className="mr-2 h-4 w-4" />
          )}
          Expand Memory
          <span className="ml-auto text-xs text-muted-foreground">
            Process and consolidate memories
          </span>
        </Button>

        <Button
          onClick={() => triggerFunction('andy-enhance-memories', 'Enhance Memories')}
          disabled={loading !== null}
          className="w-full justify-start"
          variant="outline"
        >
          {loading === 'andy-enhance-memories' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Enhance Memories
          <span className="ml-auto text-xs text-muted-foreground">
            Enrich and connect memories
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
