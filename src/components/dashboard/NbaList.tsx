/**
 * Next Best Actions List
 * Rocker AI suggestions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export function NbaList() {
  const { session } = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: actions, isLoading } = useQuery({
    queryKey: ['rocker-nba', session?.userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rocker_next_best_actions', {
        p_user_id: session?.userId
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.userId,
  });

  const logAction = useMutation({
    mutationFn: async ({ action, path }: { action: string; path?: string }) => {
      const { error } = await supabase.from('ai_action_ledger').insert({
        user_id: session?.userId,
        agent: 'rocker',
        action: 'nba_clicked',
        input: { action },
        output: { path },
        result: 'success'
      });
      if (error) throw error;
    },
    onSuccess: (_, { path }) => {
      toast({ title: 'Action logged' });
      if (path) navigate(path);
      queryClient.invalidateQueries({ queryKey: ['rocker-nba'] });
    },
  });

  if (isLoading) {
    return <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />;
  }

  if (!actions?.length) {
    return <p className="text-sm text-muted-foreground">No actions at the moment</p>;
  }

  return (
    <div className="space-y-2">
      {actions.slice(0, 5).map((action: any, i: number) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="text-sm font-medium">{action.title || 'Action'}</p>
            <p className="text-xs text-muted-foreground">{action.reason || ''}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => logAction.mutate({ action: action.title, path: action.path })}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
