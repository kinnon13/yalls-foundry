/**
 * AI Analytics Panel
 * 
 * Comprehensive dashboard for Rocker's learning, performance, and KPIs
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, TrendingUp, Target, AlertCircle, CheckCircle, XCircle,
  Eye, MessageSquare, BarChart3, Activity, Download, RefreshCw
} from 'lucide-react';
import { useSession } from '@/lib/auth/context';
import { toast } from 'sonner';

export default function AIAnalyticsPanel() {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);
  const [visualLearning, setVisualLearning] = useState<any[]>([]);
  const [termKnowledge, setTermKnowledge] = useState<any[]>([]);
  const [improvementTrend, setImprovementTrend] = useState<any>(null);

  useEffect(() => {
    if (session?.userId) {
      loadAnalytics();
    }
  }, [session]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get overall stats
      const { data: interactions } = await supabase
        .from('ai_interaction_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: visual } = await supabase
        .from('visual_learning_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: terms } = await supabase
        .from('term_knowledge')
        .select('*, term_votes(vote)')
        .eq('is_active', true)
        .order('confidence_score', { ascending: false });

      // Get user feedback/corrections
      const { data: feedback } = await supabase
        .from('ai_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Calculate stats
      const total = interactions?.length || 0;
      const successful = interactions?.filter(i => i.result_status === 'success').length || 0;
      const failed = interactions?.filter(i => i.result_status === 'failed').length || 0;
      const userCorrections = interactions?.filter(i => i.user_correction).length || 0;
      const toolUsage = interactions?.reduce((acc: any, i) => {
        const tool = i.tool_called || 'none';
        acc[tool] = (acc[tool] || 0) + 1;
        return acc;
      }, {});

      // Calculate improvement trend (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const dailyStats = last7Days.map(date => {
        const dayInteractions = interactions?.filter(i => 
          i.created_at.startsWith(date)
        ) || [];
        const daySuccesses = dayInteractions.filter(i => i.result_status === 'success').length;
        const dayTotal = dayInteractions.length;
        return {
          date,
          successRate: dayTotal > 0 ? (daySuccesses / dayTotal * 100).toFixed(1) : '0',
          total: dayTotal
        };
      });

      setStats({
        total,
        successful,
        failed,
        userCorrections,
        successRate: total > 0 ? (successful / total * 100).toFixed(1) : '0',
        toolUsage,
        visualCorrections: visual?.length || 0,
        knownTerms: terms?.length || 0,
        feedbackCount: feedback?.length || 0
      });
      setRecentInteractions(interactions || []);
      setVisualLearning(visual || []);
      setTermKnowledge(terms || []);
      setImprovementTrend(dailyStats);
    } catch (error) {
      console.error('[AI Analytics] Load error:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const data = {
        stats,
        recentInteractions,
        visualLearning,
        termKnowledge,
        improvementTrend,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rocker-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Analytics exported successfully');
    } catch (error) {
      console.error('[AI Analytics] Export error:', error);
      toast.error('Failed to export analytics');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI Analytics & Learning
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track Rocker's performance, learning, and improvement over time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAnalytics} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={exportData} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics - Compact Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Total</span>
          </div>
          <div className="text-2xl font-bold">{stats?.total || 0}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground">Success</span>
          </div>
          <div className="text-2xl font-bold">{stats?.successRate}%</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-muted-foreground">Failed</span>
          </div>
          <div className="text-2xl font-bold">{stats?.failed || 0}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground">Corrections</span>
          </div>
          <div className="text-2xl font-bold">{stats?.userCorrections || 0}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-muted-foreground">Terms</span>
          </div>
          <div className="text-2xl font-bold">{stats?.knownTerms || 0}</div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="interactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="visual">Visual Learning</TabsTrigger>
          <TabsTrigger value="terms">Knowledge Base</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Interactions</CardTitle>
              <CardDescription>Latest {recentInteractions.length} AI interactions with pass/fail status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {recentInteractions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {interaction.result_status === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        {interaction.result_status === 'failed' && (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        {interaction.result_status === 'partial' && (
                          <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{interaction.intent}</span>
                      </div>
                      {interaction.tool_called && (
                        <Badge variant="secondary" className="text-xs">
                          {interaction.tool_called}
                        </Badge>
                      )}
                      {interaction.error_message && (
                        <p className="text-xs text-red-500 mt-1 truncate">
                          {interaction.error_message}
                        </p>
                      )}
                      {interaction.user_correction && (
                        <p className="text-xs text-blue-500 mt-1 truncate">
                          Correction: {interaction.user_correction}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                      {new Date(interaction.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tool Usage Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tool Usage</CardTitle>
              <CardDescription>Most frequently used tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats?.toolUsage || {})
                  .sort(([,a]: any, [,b]: any) => b - a)
                  .slice(0, 10)
                  .map(([tool, count]: any) => (
                    <div key={tool} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{tool}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-accent rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visual Learning Events</CardTitle>
              <CardDescription>When users showed Rocker the correct way</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {visualLearning.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{event.action_attempted}</span>
                      </div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {event.correction_type}
                      </Badge>
                      {event.user_feedback && (
                        <p className="text-sm text-muted-foreground">{event.user_feedback}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
                {visualLearning.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No visual corrections yet. Show Rocker what to do when it fails!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Knowledge Base</CardTitle>
              <CardDescription>Terms and definitions Rocker has learned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {termKnowledge.map((term) => {
                  const votes = term.term_votes || [];
                  const netScore = votes.reduce((acc: number, v: any) => acc + v.vote, 0);
                  return (
                    <div
                      key={term.id}
                      className="p-3 border rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{term.term}</span>
                            <Badge variant={term.source_type === 'web' ? 'default' : 'secondary'}>
                              {term.source_type}
                            </Badge>
                            {netScore > 0 && (
                              <Badge variant="outline" className="text-green-600">
                                +{netScore} votes
                              </Badge>
                            )}
                          </div>
                          {term.title && (
                            <p className="text-sm font-medium text-muted-foreground mt-1">
                              {term.title}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-xs text-muted-foreground">
                            {(term.confidence_score * 100).toFixed(0)}% confidence
                          </div>
                        </div>
                      </div>
                      {term.summary && (
                        <p className="text-sm text-muted-foreground">{term.summary}</p>
                      )}
                      {term.source_url && (
                        <a
                          href={term.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                        >
                          View source →
                        </a>
                      )}
                    </div>
                  );
                })}
                {termKnowledge.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No terms learned yet. Ask Rocker about unclear terms!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Improvement Trends
              </CardTitle>
              <CardDescription>Success rate over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {improvementTrend?.map((day: any) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{day.date}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-48 h-3 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                          style={{ width: `${day.successRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-16 text-right">{day.successRate}%</span>
                      <span className="text-xs text-muted-foreground w-20 text-right">
                        ({day.total} total)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Learning Velocity</CardTitle>
              <CardDescription>How fast Rocker is improving</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Failed actions with corrections</span>
                  <Badge variant="outline">{stats?.failed || 0} failures logged</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Visual demonstrations</span>
                  <Badge variant="outline">{stats?.visualCorrections || 0} shown</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Knowledge base entries</span>
                  <Badge variant="outline">{stats?.knownTerms || 0} terms</Badge>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    {stats?.successful > 0 && stats?.failed > 0
                      ? `Rocker is learning from ${stats.failed} failures and applying corrections to improve.`
                      : 'Keep using Rocker and providing feedback to accelerate learning!'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
