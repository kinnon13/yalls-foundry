/**
 * Rocker Learning Panel
 * 
 * View and manage Rocker's learning data:
 * - Failed DOM attempts
 * - Selector memory
 * - Element training interface
 * - Knowledge base entries
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, AlertCircle, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RockerLearningPanel() {
  const [failures, setFailures] = useState<any[]>([]);
  const [selectorMemory, setSelectorMemory] = useState<any[]>([]);
  const [availableElements, setAvailableElements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLearningData();
  }, []);

  // Live updates when learning data changes
  useEffect(() => {
    const channel = supabase
      .channel('ai_learning')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_feedback' }, loadLearningData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_selector_memory' }, loadLearningData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  const loadLearningData = async () => {
    setLoading(true);
    try {
      // Load failures
      const { data: failureData } = await supabase
        .from('ai_feedback')
        .select('*')
        .eq('kind', 'dom_failure')
        .order('created_at', { ascending: false })
        .limit(50);

      setFailures(failureData || []);

      // Load selector memory
      const { data: memoryData } = await supabase
        .from('ai_selector_memory')
        .select('*')
        .order('last_attempt_at', { ascending: false })
        .limit(100);

      setSelectorMemory(memoryData || []);
    } catch (error) {
      console.error('Failed to load learning data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load learning data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const scanCurrentPage = async () => {
    try {
      // This will trigger Rocker to enumerate elements
      const { data, error } = await supabase.functions.invoke('rocker-chat', {
        body: {
          messages: [{
            role: 'user',
            content: 'List all clickable elements and form fields you can see on the current page with their data-rocker attributes, aria-labels, and names.'
          }],
          currentRoute: window.location.pathname,
          actor_role: 'admin'
        }
      });

      if (error) throw error;

      toast({
        title: 'Page Scan Complete',
        description: 'Check the Admin Rocker chat for the full list of elements'
      });
    } catch (error) {
      console.error('Scan failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to scan page',
        variant: 'destructive'
      });
    }
  };

  const testLearningSystem = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast({
          title: 'Not Signed In',
          description: 'You must be signed in to test the learning system',
          variant: 'destructive'
        });
        return;
      }

      // Import the DOM agent functions
      const { clickElement } = await import('@/lib/ai/rocker/dom-agent');
      
      // Try to click a non-existent element to generate a failure
      await clickElement('nonexistent-test-button-12345', session.user.id);
      
      // Wait a bit for the log to be written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload data
      await loadLearningData();
      
      toast({
        title: 'Test Complete',
        description: 'Check the Failed Attempts tab for the test failure'
      });
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Test Error',
        description: 'Failed to run learning test',
        variant: 'destructive'
      });
    }
  };

  const runQuickAudit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast({ title: 'Not Signed In', description: 'Sign in to run audits', variant: 'destructive' });
        return;
      }
      const { clickElement } = await import('@/lib/ai/rocker/dom-agent');
      const targets = ['post field', 'post button', 'write a post', 'composer'];
      for (const t of targets) {
        try { await clickElement(t, session.user.id); } catch {}
      }
      toast({ title: 'Audit Triggered', description: 'Attempted to locate key elements. Check failures below.' });
      await new Promise(r => setTimeout(r, 800));
      await loadLearningData();
    } catch (error) {
      console.error('Audit failed:', error);
      toast({ title: 'Audit Error', description: 'Failed to run quick audit', variant: 'destructive' });
    }
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Rocker Learning Dashboard
              </CardTitle>
              <CardDescription>
                View failures, selector memory, and train Rocker on UI elements
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={testLearningSystem} variant="secondary" size="sm">
                <Brain className="h-4 w-4 mr-2" />
                Test Learning
              </Button>
              <Button onClick={runQuickAudit} variant="outline" size="sm">
                Audit Page
              </Button>
              <Button onClick={scanCurrentPage} variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Scan Page
              </Button>
              <Button onClick={loadLearningData} variant="outline" size="icon" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="failures" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="failures">
                Failed Attempts ({failures.length})
              </TabsTrigger>
              <TabsTrigger value="memory">
                Selector Memory ({selectorMemory.length})
              </TabsTrigger>
              <TabsTrigger value="train">
                Element Training
              </TabsTrigger>
            </TabsList>

            <TabsContent value="failures" className="space-y-4 mt-4">
              {failures.length === 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold mb-2">No Learning Data Yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          The learning system captures failures when Rocker attempts DOM actions. To generate learning data:
                        </p>
                        <ol className="text-sm text-left space-y-2 max-w-md mx-auto list-decimal list-inside">
                          <li>Click "Test Learning" to generate a test failure</li>
                          <li>Use Rocker to interact with the page (e.g., "click the post button")</li>
                          <li>Failures are automatically logged when elements aren't found</li>
                        </ol>
                      </div>
                      <Button onClick={testLearningSystem} variant="default">
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Test Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {failures.length > 0 && (
                <div className="text-sm text-muted-foreground mb-4">
                  Recent DOM action failures that Rocker is learning from ({failures.length} total)
                </div>
              )}
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {failures.map((failure) => {
                    const payload = failure.payload as any;
                    return (
                      <Card key={failure.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-destructive" />
                                <span className="font-semibold">{payload?.action}</span>
                                <Badge variant="destructive">Failed</Badge>
                              </div>
                              <div className="text-sm">
                                <div><strong>Target:</strong> {payload?.target}</div>
                                <div><strong>Message:</strong> {payload?.message}</div>
                                <div><strong>Page:</strong> {payload?.page}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(failure.created_at).toLocaleString()}
                                </div>
                              </div>
                              {payload?.available_elements && (
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-muted-foreground">
                                    Available elements ({payload.available_elements.length})
                                  </summary>
                                  <div className="mt-2 space-y-1 pl-4">
                                    {payload.available_elements.map((el: string, i: number) => (
                                      <div key={i} className="font-mono">{el}</div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {failures.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>No recent failures! Rocker is performing well.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="memory" className="space-y-4 mt-4">
              {selectorMemory.length === 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold mb-2">No Selector Memory Yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Selector memory builds as Rocker successfully learns element locations. 
                          This happens when you confirm elements during Learn Mode or when Rocker 
                          finds elements consistently.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectorMemory.length > 0 && (
                <div className="text-sm text-muted-foreground mb-4">
                  Learned selectors and their success rates ({selectorMemory.length} total)
                </div>
              )}
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {selectorMemory.map((memory) => {
                    const successRate = memory.successes + memory.failures > 0
                      ? (memory.successes / (memory.successes + memory.failures) * 100).toFixed(0)
                      : 0;
                    
                    return (
                      <Card key={memory.id}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Brain className="h-4 w-4" />
                                <span className="font-semibold">{memory.target_name}</span>
                              </div>
                              <Badge variant={Number(successRate) > 70 ? "default" : "secondary"}>
                                {successRate}% success
                              </Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              <div><strong>Route:</strong> {memory.route}</div>
                              <div><strong>Selector:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">{memory.selector}</code></div>
                              <div><strong>Score:</strong> {memory.score.toFixed(2)}</div>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span className="text-green-600">✓ {memory.successes} successes</span>
                                <span className="text-red-600">✗ {memory.failures} failures</span>
                              </div>
                              {memory.last_success_at && (
                                <div className="text-xs text-muted-foreground">
                                  Last success: {new Date(memory.last_success_at).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {selectorMemory.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Brain className="h-12 w-12 mx-auto mb-2" />
                      <p>No selector memory yet. Use Rocker to start building the knowledge base.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="train" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Element Training</CardTitle>
                  <CardDescription>
                    Train Rocker to recognize elements on the current page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <h4 className="font-semibold mb-2">How to train Rocker:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Click "Scan Current Page" to have Rocker enumerate all elements</li>
                      <li>Ask Rocker via Admin Rocker chat: "What elements can you see?"</li>
                      <li>When Rocker fails to find something, it logs the failure here</li>
                      <li>The selector memory builds automatically as Rocker learns</li>
                      <li>Review failures to see what elements Rocker struggles with</li>
                    </ol>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-2">Training Tips:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Add <code className="text-xs bg-muted px-1 py-0.5 rounded">data-rocker</code> attributes to important elements</li>
                      <li>Use descriptive <code className="text-xs bg-muted px-1 py-0.5 rounded">aria-label</code> attributes</li>
                      <li>Give form fields meaningful <code className="text-xs bg-muted px-1 py-0.5 rounded">name</code> attributes</li>
                      <li>Review the "Available elements" in failed attempts to see what Rocker saw</li>
                    </ul>
                  </div>

                  <Button onClick={scanCurrentPage} className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Scan Current Page with Rocker
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
