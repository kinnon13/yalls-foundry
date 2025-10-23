/**
 * Andy's Brain - Full Capabilities Dashboard
 * 
 * Shows ALL of Andy's active capabilities:
 * - Real-time reasoning (Grok)
 * - Memory & learning
 * - Task management
 * - Document analysis
 * - Predictions
 * - Proactive suggestions
 * - MDR orchestration
 */

import { useState, useEffect } from 'react';
import { Brain, Zap, Database, FileText, Target, TrendingUp, Network } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface BrainMetrics {
  memories_count: number;
  tasks_active: number;
  docs_analyzed: number;
  predictions_made: number;
  suggestions_today: number;
  mdr_tasks_queued: number;
  learning_rate: number;
}

export function AndyBrain() {
  const [metrics, setMetrics] = useState<BrainMetrics>({
    memories_count: 0,
    tasks_active: 0,
    docs_analyzed: 0,
    predictions_made: 0,
    suggestions_today: 0,
    mdr_tasks_queued: 0,
    learning_rate: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBrainMetrics();
  }, []);

  const loadBrainMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all metrics in parallel
      const [memories, tasks, docs, predictions, suggestions] = await Promise.all([
        supabase.from('ai_user_memory').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('rocker_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'in_progress'),
        supabase.from('ai_docs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('rocker_predictions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('ai_proposals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())
      ]);

      setMetrics({
        memories_count: memories.count || 0,
        tasks_active: tasks.count || 0,
        docs_analyzed: docs.count || 0,
        predictions_made: predictions.count || 0,
        suggestions_today: suggestions.count || 0,
        mdr_tasks_queued: 0, // TODO: query mdr_tasks table
        learning_rate: Math.min(100, (memories.count || 0) / 10)
      });
    } catch (error) {
      console.error('Failed to load brain metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const capabilities = [
    {
      name: 'Grok Reasoning',
      icon: Brain,
      status: 'active',
      description: 'All AI powered by Grok',
      metric: 'grok-4-fast-reasoning',
      color: 'text-blue-500'
    },
    {
      name: 'Memory System',
      icon: Database,
      status: 'active',
      description: 'Learning & remembering',
      metric: `${metrics.memories_count} memories`,
      color: 'text-purple-500'
    },
    {
      name: 'Document Analysis',
      icon: FileText,
      status: 'active',
      description: 'Vision + RAG search',
      metric: `${metrics.docs_analyzed} analyzed`,
      color: 'text-green-500'
    },
    {
      name: 'Task Management',
      icon: Target,
      status: 'active',
      description: 'Proactive task tracking',
      metric: `${metrics.tasks_active} active`,
      color: 'text-orange-500'
    },
    {
      name: 'Predictions',
      icon: TrendingUp,
      status: 'active',
      description: 'Future forecasting',
      metric: `${metrics.predictions_made} made`,
      color: 'text-pink-500'
    },
    {
      name: 'MDR Orchestration',
      icon: Network,
      status: 'active',
      description: 'Multi-dimensional reasoning',
      metric: `${metrics.mdr_tasks_queued} queued`,
      color: 'text-cyan-500'
    },
    {
      name: 'Proactive Suggestions',
      icon: Zap,
      status: 'active',
      description: 'Real-time insights',
      metric: `${metrics.suggestions_today} today`,
      color: 'text-yellow-500'
    }
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Andy's Brain</h2>
            <p className="text-sm text-muted-foreground">Full cognitive capabilities powered by Grok</p>
          </div>
          <Badge variant={isLoading ? 'secondary' : 'default'} className="h-8">
            {isLoading ? 'Loading...' : 'All Systems Active'}
          </Badge>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Learning Rate</span>
            <span className="text-sm text-muted-foreground">{metrics.learning_rate.toFixed(0)}%</span>
          </div>
          <Progress value={metrics.learning_rate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <Card key={cap.name} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <Icon className={`h-5 w-5 ${cap.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{cap.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {cap.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{cap.description}</p>
                    <p className="text-xs font-medium mt-2 text-primary">{cap.metric}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Current Configuration
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">AI Model:</span>
              <span className="ml-2 font-mono text-xs">Grok-4</span>
            </div>
            <div>
              <span className="text-muted-foreground">Mode:</span>
              <span className="ml-2">Fast Reasoning</span>
            </div>
            <div>
              <span className="text-muted-foreground">Voice:</span>
              <span className="ml-2">ElevenLabs</span>
            </div>
            <div>
              <span className="text-muted-foreground">Embeddings:</span>
              <span className="ml-2">OpenAI</span>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
}
