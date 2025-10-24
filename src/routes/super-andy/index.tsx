import { useState, useRef, useEffect } from 'react';
import { Brain, TrendingUp, Globe, Database, Zap, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SuperAndyPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [learningMetrics, setLearningMetrics] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load learning metrics
  useEffect(() => {
    loadLearningMetrics();
    const interval = setInterval(loadLearningMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadLearningMetrics = async () => {
    try {
      const { data: external } = await supabase
        .from('ai_learning_metrics')
        .select('*')
        .eq('agent', 'super_andy')
        .eq('cycle_type', 'external')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      const { data: internal } = await supabase
        .from('ai_learning_metrics')
        .select('*')
        .eq('agent', 'super_andy')
        .eq('cycle_type', 'internal')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      const { count: externalKnowledge } = await supabase
        .from('andy_external_knowledge')
        .select('*', { count: 'exact', head: true });

      const { count: internalKnowledge } = await supabase
        .from('andy_internal_knowledge')
        .select('*', { count: 'exact', head: true });

      setLearningMetrics({
        external: { ...external, total_items: externalKnowledge },
        internal: { ...internal, total_items: internalKnowledge },
      });
    } catch (error) {
      console.error('Failed to load learning metrics:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-query-super-andy', {
        body: {
          query_type: 'analyze_pattern',
          context: { user_input: input },
          priority: 'high',
        },
      });

      if (error) throw error;

      const assistantMessage = {
        role: 'assistant',
        content: JSON.stringify(data.response, null, 2),
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Super Andy responded');
      loadLearningMetrics(); // Refresh metrics
    } catch (error: any) {
      toast.error(error.message || 'Failed to query Super Andy');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const requestResearch = async (topic: string) => {
    setInput(`Research this topic: ${topic}`);
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Super Andy</h1>
            <p className="text-muted-foreground">Continuous Learning AI Intelligence</p>
          </div>
        </div>

        {/* Learning Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold">External Learning</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{learningMetrics?.external?.total_items || 0}</p>
              <p className="text-xs text-muted-foreground">
                Last cycle: {learningMetrics?.external?.insights_captured || 0} insights
              </p>
              <Badge variant="outline" className="text-xs">
                Every 4 hours
              </Badge>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">Internal Learning</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{learningMetrics?.internal?.total_items || 0}</p>
              <p className="text-xs text-muted-foreground">
                Last cycle: {learningMetrics?.internal?.patterns_found || 0} patterns
              </p>
              <Badge variant="outline" className="text-xs">
                Every 2 hours
              </Badge>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold">Optimizations</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {learningMetrics?.internal?.optimizations_applied || 0}
              </p>
              <p className="text-xs text-muted-foreground">Applied automatically</p>
              <Badge variant="outline" className="text-xs">
                Real-time
              </Badge>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold">Active Status</h3>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold">ACTIVE</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Learning loops running
              </p>
            </div>
          </Card>
        </div>

        {/* Research Topics */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Research Topics</h2>
          <div className="flex flex-wrap gap-2">
            {[
              'ai_safety_emerging_risks',
              'platform_scaling_strategies',
              'user_engagement_optimization',
              'anomaly_detection_methods',
              'security_best_practices',
            ].map(topic => (
              <Button
                key={topic}
                variant="outline"
                size="sm"
                onClick={() => requestResearch(topic)}
                className="text-xs"
              >
                {topic.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        </Card>

        {/* Chat Interface */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Chat with Super Andy</h2>
          
          {/* Messages */}
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Start a conversation with Super Andy. Ask about patterns, anomalies, or request research on specific topics.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary/10 ml-12'
                    : 'bg-muted mr-12'
                }`}
              >
                <p className="text-xs font-semibold mb-1 uppercase">
                  {msg.role === 'user' ? 'You' : 'Super Andy'}
                </p>
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {msg.content}
                </pre>
              </div>
            ))}
            {loading && (
              <div className="p-4 rounded-lg bg-muted mr-12">
                <p className="text-xs font-semibold mb-1">SUPER ANDY</p>
                <p className="text-sm text-muted-foreground">Analyzing...</p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Super Andy anything... (Press Enter to send, Shift+Enter for new line)"
              className="min-h-[80px]"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-[80px] w-12"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
