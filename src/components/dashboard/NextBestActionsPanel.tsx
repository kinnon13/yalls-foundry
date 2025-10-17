import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Loader2, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NextBestAction {
  action: string;
  why: string;
  cta: string;
  href: string;
  weight: number;
  meta?: Record<string, any>;
}

export function NextBestActionsPanel() {
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: actionsRaw, isLoading } = useQuery({
    queryKey: ['next-best-actions', session?.userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rocker_next_best_actions', {
        p_user_id: session?.userId
      });
      
      if (error) throw error;
      
      // Parse if string, handle as array
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return (Array.isArray(parsed) ? parsed : []) as NextBestAction[];
    },
    enabled: !!session?.userId,
    refetchInterval: 5 * 60 * 1000,
  });

  const actions = useMemo(() => {
    if (!actionsRaw) return [];
    return actionsRaw
      .sort((a, b) => (b.weight || 0) - (a.weight || 0))
      .slice(0, 5);
  }, [actionsRaw]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Next Best Actions
          </CardTitle>
          <CardDescription>AI-powered suggestions to grow your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Next Best Actions
          </CardTitle>
          <CardDescription>AI-powered suggestions to grow your business</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            You're all caught up! Keep up the great work.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Next Best Actions
        </CardTitle>
        <CardDescription>AI-powered suggestions to grow your business</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, idx) => (
            <div
              key={`${action.action}-${idx}`}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{action.cta}</p>
                <p className="text-xs text-muted-foreground">{action.why}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(action.href)}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
