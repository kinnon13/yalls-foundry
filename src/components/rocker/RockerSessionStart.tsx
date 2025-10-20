/**
 * Rocker Session Starter
 * Quick-start interface for new Rocker conversations
 */

import { useState } from 'react';
import { MessageSquarePlus, Sparkles, Target, Calendar, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const STARTER_PROMPTS = [
  {
    icon: Target,
    title: "Daily Planning",
    prompt: "Rocker, review my calendar and inbox, then give me my top 3 priorities and suggest one focus task to start.",
    color: "text-blue-600"
  },
  {
    icon: Sparkles,
    title: "Marketing Campaign",
    prompt: "Rocker, draft a 4-week GTM campaign for our creator marketplace. Include channels, budget, and daily actions. Start with week 1 tasks.",
    color: "text-purple-600"
  },
  {
    icon: Calendar,
    title: "Event Planning",
    prompt: "Rocker, help me plan a launch event. Ask me questions about goals, budget, and timing, then create a checklist.",
    color: "text-green-600"
  },
  {
    icon: DollarSign,
    title: "Financial Review",
    prompt: "Rocker, show me our budget status and flag anything that needs attention. Propose next steps for cash management.",
    color: "text-yellow-600"
  },
  {
    icon: Users,
    title: "CRM Follow-ups",
    prompt: "Rocker, who should I follow up with today? Give me a list with reasons and draft messages.",
    color: "text-pink-600"
  }
];

export function RockerSessionStart() {
  const [open, setOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startSession = async (prompt: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create new session
      const { data: session, error } = await supabase
        .from('ai_sessions')
        .insert({
          user_id: user.id,
          tenant_id: user.id,
          model_id: 'rocker-chief-of-staff',
          actor_role: 'user',
          params: { initial_prompt: prompt }
        })
        .select()
        .single();

      if (error) throw error;

      // Log initial action
      await supabase
        .from('ai_action_ledger')
        .insert({
          user_id: user.id,
          agent: 'rocker',
          action: 'session_start',
          input: { prompt },
          output: { session_id: session.id },
          result: 'success',
          correlation_id: session.id
        });

      // Navigate to chat interface
      navigate(`/rocker/chat?session=${session.id}`);
      setOpen(false);

    } catch (error: any) {
      console.error('Failed to start session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <MessageSquarePlus className="h-5 w-5" />
          New Rocker Session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Start a Rocker Session</DialogTitle>
          <p className="text-muted-foreground">
            Pick a template or write your own. Rocker will ask clarifying questions and create a plan.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Quick Starts</h3>
            <div className="grid gap-3">
              {STARTER_PROMPTS.map((starter) => (
                <Card
                  key={starter.title}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => startSession(starter.prompt)}
                >
                  <div className="flex items-start gap-3">
                    <starter.icon className={`h-5 w-5 mt-0.5 ${starter.color}`} />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{starter.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {starter.prompt}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Custom Prompt</h3>
            <Textarea
              placeholder="Tell Rocker what you need help with...&#10;&#10;Example:&#10;Rocker, you are my chief of staff. Goal this week: ship beta to 100 creators. I have ADHD — keep me focused. Build today's plan and start a 25-min sprint."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[120px]"
            />
            <Button
              onClick={() => startSession(customPrompt)}
              disabled={!customPrompt.trim() || loading}
              className="w-full mt-3"
            >
              {loading ? 'Starting...' : 'Start Custom Session'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}