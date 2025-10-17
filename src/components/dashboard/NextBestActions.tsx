import { useState } from 'react';
import { 
  Zap, 
  ArrowRight,
  Loader2 
} from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Action {
  id: string;
  title: string;
  rationale: string;
  impact_score: number;
  cta: {
    rpc: string;
    params: Record<string, any>;
  };
}

interface NextBestActionsProps {
  actions: Action[];
  isLoading: boolean;
}

export function NextBestActions({ actions, isLoading }: NextBestActionsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [executing, setExecuting] = useState<string | null>(null);

  const handleAction = async (action: Action) => {
    setExecuting(action.id);

    try {
      // Handle navigation actions
      if (action.cta.rpc.startsWith('navigate_to_')) {
        const destination = action.cta.rpc.replace('navigate_to_', '');
        navigate(`/dashboard/${destination}`);
        
        // Log action
        await supabase.from('ai_action_ledger').insert({
          user_id: action.cta.params.user_id,
          agent: 'user',
          action: action.cta.rpc,
          input: action.cta.params,
          output: { navigated: true },
          result: 'success',
        });

        toast({
          title: 'Navigating',
          description: `Taking you to ${destination}`,
        });
        return;
      }

      // Handle other RPC calls (placeholder - implement actual RPC calls)
      console.log('RPC call:', action.cta.rpc, action.cta.params);

      // Log successful action
      await supabase.from('ai_action_ledger').insert({
        user_id: action.cta.params.user_id,
        agent: 'rocker',
        action: action.cta.rpc,
        input: action.cta.params,
        output: { success: true },
        result: 'success',
      });

      toast({
        title: 'Action completed',
        description: action.title,
      });
    } catch (error) {
      console.error('Action failed:', error);
      
      // Log failed action
      await supabase.from('ai_action_ledger').insert({
        user_id: action.cta.params.user_id,
        agent: 'rocker',
        action: action.cta.rpc,
        input: action.cta.params,
        output: { error: error instanceof Error ? error.message : 'Unknown error' },
        result: 'failure',
      });

      toast({
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setExecuting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Zap size={24} className="text-primary" />
          Next Best Actions
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Zap size={24} className="text-primary" />
          Next Best Actions
        </h2>
        <div className="p-8 rounded-lg border border-border bg-card text-center">
          <p className="text-muted-foreground">All caught up! No actions needed right now.</p>
        </div>
      </div>
    );
  }

  // Sort by impact score
  const sortedActions = [...actions].sort((a, b) => b.impact_score - a.impact_score);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <Zap size={24} className="text-primary" />
        Next Best Actions
      </h2>
      <div className="space-y-3">
        {sortedActions.map((action) => (
          <div
            key={action.id}
            className="p-6 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{action.title}</h3>
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    Impact: {action.impact_score}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{action.rationale}</p>
              </div>
              <Button
                variant="primary"
                size="m"
                onClick={() => handleAction(action)}
                disabled={executing === action.id}
              >
                {executing === action.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    Take Action
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
