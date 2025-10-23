/**
 * Andy Learning Assignment
 * Give Andy topics/domains to learn and track progress
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Plus, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LearningAssignment {
  topic: string;
  context: string;
  priority: 'low' | 'medium' | 'high';
  category: 'technical' | 'business' | 'personal' | 'creative';
}

export function AndyLearningAssignment() {
  const { toast } = useToast();
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignment, setAssignment] = useState<LearningAssignment>({
    topic: '',
    context: '',
    priority: 'medium',
    category: 'technical',
  });

  const handleAssign = async () => {
    if (!assignment.topic.trim()) {
      toast({ title: 'Topic required', description: 'Please enter a topic for Andy to learn', variant: 'destructive' });
      return;
    }

    setIsAssigning(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create learning entry in rocker_long_memory
      const { error: learningError } = await supabase
        .from('rocker_long_memory')
        .insert({
          user_id: user.id,
          kind: 'learning_goal',
          key: `learn_${assignment.category}_${Date.now()}`,
          value: {
            topic: assignment.topic,
            context: assignment.context,
            priority: assignment.priority,
            category: assignment.category,
            assigned_at: new Date().toISOString(),
            status: 'pending',
          },
          tags: [assignment.category, 'user_assigned', assignment.priority],
        });

      if (learningError) throw learningError;

      // Create a task for Andy to research this
      const { error: taskError } = await supabase
        .from('rocker_tasks')
        .insert({
          user_id: user.id,
          title: `Research: ${assignment.topic}`,
          body: assignment.context,
          status: 'open',
          kind: 'andy_learning',
          metadata: {
            category: assignment.category,
            priority: assignment.priority,
          }
        });

      if (taskError) throw taskError;

      // Trigger Andy's learning worker
      await supabase.functions.invoke('aggregate-learnings', {
        body: { force: true }
      });

      toast({
        title: 'Learning assigned!',
        description: `Andy will research "${assignment.topic}" and build knowledge from it.`,
      });

      // Reset form
      setAssignment({
        topic: '',
        context: '',
        priority: 'medium',
        category: 'technical',
      });
    } catch (error: any) {
      console.error('Failed to assign learning:', error);
      toast({
        title: 'Assignment failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Assign Learning Topic</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Topic / Domain</label>
          <Input
            placeholder="e.g., Quantum Computing, Market Analysis, Personal Fitness..."
            value={assignment.topic}
            onChange={(e) => setAssignment({ ...assignment, topic: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Context & Goals</label>
          <Textarea
            placeholder="What should Andy focus on? What specific questions should be answered? What depth of knowledge is needed?"
            value={assignment.context}
            onChange={(e) => setAssignment({ ...assignment, context: e.target.value })}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select
              value={assignment.category}
              onValueChange={(v: any) => setAssignment({ ...assignment, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <Select
              value={assignment.priority}
              onValueChange={(v: any) => setAssignment({ ...assignment, priority: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleAssign}
          disabled={isAssigning || !assignment.topic.trim()}
          className="w-full"
        >
          {isAssigning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Assigning...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Assign to Andy
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Andy will research this topic, build knowledge, and be able to answer questions about it in future conversations.
        </p>
      </div>
    </Card>
  );
}
