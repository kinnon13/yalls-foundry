import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, Globe, Database, TrendingUp, Clock, Zap, 
  Calendar, FileText, Activity, Shield, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface LearningMetrics {
  external: {
    total_items: number;
    insights_captured: number;
    last_run?: string;
  };
  internal: {
    total_items: number;
    patterns_found: number;
    optimizations_applied: number;
    last_run?: string;
  };
}

export default function AndySystemsOverview() {
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: external } = await (supabase as any)
        .from('ai_learning_metrics')
        .select('*')
        .eq('agent', 'super_andy')
        .eq('cycle_type', 'external')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: internal } = await (supabase as any)
        .from('ai_learning_metrics')
        .select('*')
        .eq('agent', 'super_andy')
        .eq('cycle_type', 'internal')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: externalKnowledge } = await (supabase as any)
        .from('andy_external_knowledge')
        .select('*', { count: 'exact', head: true });

      const { count: internalKnowledge } = await (supabase as any)
        .from('andy_internal_knowledge')
        .select('*', { count: 'exact', head: true });

      setMetrics({
        external: { 
          ...external, 
          total_items: externalKnowledge || 0,
          last_run: external?.completed_at 
        },
        internal: { 
          ...internal, 
          total_items: internalKnowledge || 0,
          last_run: internal?.completed_at
        },
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const triggerLearningCycle = async (type: 'external' | 'internal') => {
    setLoading(true);
    try {
      const functionName = type === 'external' 
        ? 'super-andy-learn-external' 
        : 'aggregate-learnings';

      await supabase.functions.invoke(functionName);
      toast.success(`${type} learning cycle triggered`);
      setTimeout(loadMetrics, 2000);
    } catch (error) {
      toast.error('Failed to trigger learning cycle');
    } finally {
      setLoading(false);
    }
  };

  const edgeFunctions = [
    { name: 'andy-chat', desc: 'Streaming AI chat with memory & Lovable AI (Gemini 2.5 Flash)', icon: Brain },
    { name: 'super-andy-web-search', desc: 'Web search & real-time learning via AI', icon: Globe },
    { name: 'super-andy-learn-external', desc: 'External knowledge acquisition from web/APIs', icon: Database },
    { name: 'aggregate-learnings', desc: 'Internal pattern analysis & optimization', icon: TrendingUp },
    { name: 'andy-expand-memory', desc: 'Memory system expansion every 10 messages', icon: Brain },
    { name: 'andy-learn-from-message', desc: 'Deep analysis on each message', icon: Activity },
    { name: 'andy-auto-analyze', desc: 'Automatic behavior analysis', icon: Shield },
    { name: 'andy-embed-knowledge', desc: 'Vector embeddings for semantic search', icon: Database },
  ];

  const cronJobs = [
    { name: 'External Learning', interval: '4 hours', desc: 'Research emerging topics from web' },
    { name: 'Internal Learning', interval: '2 hours', desc: 'Analyze patterns from platform data' },
    { name: 'Memory Expansion', interval: 'Every 10 msgs', desc: 'Expand knowledge graph connections' },
    { name: 'Self Improvement', interval: 'Continuous', desc: 'Optimize policies & weights' },
  ];

  const capabilities = [
    { name: 'Web Search', desc: 'Real-time internet access for research', active: true },
    { name: 'Voice Chat', desc: 'Voice input/output with Alloy voice @ 1.25x', active: true },
    { name: 'Memory System', desc: 'Multi-layer persistent memory with context', active: true },
    { name: 'Calendar Integration', desc: 'Schedule awareness & event management', active: true },
    { name: 'Document Analysis', desc: 'PDF, images, and text processing', active: true },
    { name: 'Proactive Suggestions', desc: 'Context-aware action recommendations', active: true },
    { name: 'Pattern Recognition', desc: 'Behavioral analysis & anomaly detection', active: true },
    { name: 'Self Optimization', desc: 'Automatic policy & parameter tuning', active: true },
  ];

  return (
    <div className="space-y-4">
      {/* Learning Metrics */}
      <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Learning Metrics
          </h3>
          <Button size="sm" variant="ghost" onClick={loadMetrics}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">External Knowledge</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{metrics?.external.total_items || 0}</Badge>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => triggerLearningCycle('external')}
                disabled={loading}
              >
                <Zap className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Internal Patterns</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{metrics?.internal.total_items || 0}</Badge>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => triggerLearningCycle('internal')}
                disabled={loading}
              >
                <Zap className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Optimizations</span>
            <Badge variant="outline">{metrics?.internal.optimizations_applied || 0}</Badge>
          </div>
        </div>
      </Card>

      {/* Edge Functions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Edge Functions
        </h3>
        <div className="space-y-2">
          {edgeFunctions.map(fn => (
            <div key={fn.name} className="flex items-start gap-2 p-2 rounded bg-muted/50">
              <fn.icon className="w-3 h-3 mt-0.5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{fn.name}</p>
                <p className="text-[10px] text-muted-foreground">{fn.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Cron Jobs */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Learning Loops
        </h3>
        <div className="space-y-2">
          {cronJobs.map(job => (
            <div key={job.name} className="flex items-start justify-between gap-2 p-2 rounded bg-muted/50">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{job.name}</p>
                <p className="text-[10px] text-muted-foreground">{job.desc}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {job.interval}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Capabilities */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Active Capabilities
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {capabilities.map(cap => (
            <div key={cap.name} className="flex items-center justify-between gap-2 p-2 rounded bg-muted/50">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{cap.name}</p>
                <p className="text-[10px] text-muted-foreground">{cap.desc}</p>
              </div>
              <div className={`w-2 h-2 rounded-full ${cap.active ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
            </div>
          ))}
        </div>
      </Card>

      {/* Learning Tables */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Knowledge Tables
        </h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">andy_external_knowledge</span>
            <Badge variant="outline" className="text-[10px]">Web/API data</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">andy_internal_knowledge</span>
            <Badge variant="outline" className="text-[10px]">Platform patterns</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ai_learning_metrics</span>
            <Badge variant="outline" className="text-[10px]">Cycle tracking</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ai_optimization_queue</span>
            <Badge variant="outline" className="text-[10px]">Auto-tuning</Badge>
          </div>
        </div>
      </Card>

      {/* Status */}
      <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">System Status</p>
            <p className="text-[10px] text-muted-foreground">
              Last sync: {metrics?.internal.last_run 
                ? new Date(metrics.internal.last_run).toLocaleString() 
                : 'Never'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold">ACTIVE</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
