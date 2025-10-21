import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Brain, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AuditResult {
  status: 'healthy' | 'degraded' | 'error';
  results: {
    tests: Record<string, { status: 'pass' | 'fail'; message: string; duration?: number }>;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

interface Insight {
  type: 'pattern' | 'opportunity' | 'reminder' | 'task' | 'risk';
  title: string;
  description: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
}

export function ProactivePanel() {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<{ audit: boolean; insights: boolean }>({
    audit: false,
    insights: false,
  });

  const runAudit = async () => {
    setLoading(prev => ({ ...prev, audit: true }));
    try {
      const { data, error } = await supabase.functions.invoke('rocker-audit-system');
      
      if (error) throw error;
      
      setAuditResult(data);
      toast({
        title: 'System Audit Complete',
        description: `Status: ${data.status}. ${data.summary.passed}/${data.summary.total} tests passed.`,
      });
    } catch (error) {
      console.error('[Audit] Error:', error);
      toast({
        title: 'Audit Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, audit: false }));
    }
  };

  const extractInsights = async () => {
    setLoading(prev => ({ ...prev, insights: true }));
    try {
      const { data, error } = await supabase.functions.invoke('rocker-insights', {
        body: { lookback: 7 }
      });
      
      if (error) throw error;
      
      setInsights(data.insights || []);
      toast({
        title: 'Insights Extracted',
        description: `Found ${data.insights?.length || 0} insights from your data.`,
      });
    } catch (error) {
      console.error('[Insights] Error:', error);
      toast({
        title: 'Insight Extraction Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, insights: false }));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pattern': return '🔍';
      case 'opportunity': return '💡';
      case 'reminder': return '⏰';
      case 'task': return '✅';
      case 'risk': return '⚠️';
      default: return '📌';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/25">
          <Brain className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Proactive AI System</h2>
          <p className="text-sm text-muted-foreground">Step 1 & 2: System Health & Insights</p>
        </div>
      </div>

      {/* System Audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            System Audit (Step 1)
          </CardTitle>
          <CardDescription>
            Test all core Rocker features: AI chat, embeddings, memory, storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runAudit}
            disabled={loading.audit}
            className="w-full"
          >
            {loading.audit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run System Audit
          </Button>

          {auditResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">Overall Status:</span>
                <Badge variant={auditResult.status === 'healthy' ? 'default' : 'destructive'}>
                  {auditResult.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                {Object.entries(auditResult.results.tests).map(([key, result]) => (
                  <div key={key} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-medium">{key.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      {result.duration && (
                        <span className="text-xs text-muted-foreground">{result.duration}ms</span>
                      )}
                      {result.status === 'pass' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Extraction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Insight Extraction (Step 2)
          </CardTitle>
          <CardDescription>
            Analyze messages and memories to find patterns, opportunities, and actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={extractInsights}
            disabled={loading.insights}
            className="w-full"
            variant="secondary"
          >
            {loading.insights && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Extract Insights
          </Button>

          {insights.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Found {insights.length} insights:
              </div>

              {insights.map((insight, idx) => (
                <Card key={idx} className="border-l-4" style={{
                  borderLeftColor: insight.priority === 'high' ? 'hsl(var(--destructive))' : 
                                   insight.priority === 'medium' ? 'hsl(var(--primary))' : 
                                   'hsl(var(--muted))'
                }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getTypeIcon(insight.type)}</span>
                        <span className="font-semibold">{insight.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityColor(insight.priority)}>
                          {insight.priority}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(insight.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {insight.description}
                    </p>
                    
                    {insight.action && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <span className="font-medium">Action: </span>
                        {insight.action}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-muted rounded-lg text-sm">
        <p className="font-medium mb-2">🚀 Next Steps (Step 3-5):</p>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Set up cron triggers for daily autonomous analysis</li>
          <li>• Implement action execution (auto-create tasks, reminders)</li>
          <li>• Add user consent and preference controls</li>
          <li>• Deploy proactive notifications to chat</li>
        </ul>
      </div>
    </div>
  );
}
