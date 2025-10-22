/**
 * Admin Rocker - Moderation
 * Handle incidents and content review
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminModeration() {
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents-moderation'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_incidents' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_incidents' as any)
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-moderation'] });
      toast.success('Incident resolved');
    },
  });

  const severityColor = (sev: string): "default" | "secondary" | "destructive" | "outline" => {
    if (sev === 'critical') return 'destructive';
    if (sev === 'high') return 'destructive';
    if (sev === 'medium') return 'secondary';
    return 'outline';
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading incidents...</div>;
  }

  const openIncidents = incidents.filter((i: any) => !i.resolved_at);
  const resolvedIncidents = incidents.filter((i: any) => i.resolved_at);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Moderation & Incidents</h1>
      <p className="text-muted-foreground mb-6">
        Handle incidents, content review, and escalations.
      </p>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3">Open Incidents ({openIncidents.length})</h3>
          <div className="space-y-3">
            {openIncidents.map((incident: any) => (
              <Card key={incident.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={severityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {incident.source}
                      </span>
                    </div>
                    <p className="font-medium">{incident.summary}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(incident.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => resolve.mutate(incident.id)}
                    disabled={resolve.isPending}
                  >
                    Resolve
                  </Button>
                </div>
              </Card>
            ))}
            {openIncidents.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                No open incidents. System running smoothly.
              </Card>
            )}
          </div>
        </div>

        {resolvedIncidents.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-3">Resolved Incidents</h3>
            <div className="space-y-2">
              {resolvedIncidents.slice(0, 10).map((incident: any) => (
                <Card key={incident.id} className="p-3 opacity-60">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{incident.severity}</Badge>
                      <span>{incident.summary}</span>
                    </div>
                    <span className="text-muted-foreground">
                      Resolved {format(new Date(incident.resolved_at), 'MMM d')}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
