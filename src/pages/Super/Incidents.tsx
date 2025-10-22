import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Incident = {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  summary: string;
  detail?: any;
  created_at: string;
  resolved_at?: string;
};

export default function IncidentsPage() {
  const queryClient = useQueryClient();

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      return data as Incident[];
    },
    refetchInterval: 10000,
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await supabase
        .from('ai_incidents')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incident resolved');
    },
  });

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Incidents</h1>
      
      <Table data-testid="incidents-table">
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => {
            const age = Math.floor((Date.now() - new Date(incident.created_at).getTime()) / 60000);
            return (
              <TableRow key={incident.id}>
                <TableCell>
                  <Badge variant={severityColor(incident.severity)}>
                    {incident.severity.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{incident.source}</TableCell>
                <TableCell>{incident.summary}</TableCell>
                <TableCell>{age}m ago</TableCell>
                <TableCell>
                  {incident.resolved_at ? (
                    <Badge variant="outline">Resolved</Badge>
                  ) : (
                    <Badge>Open</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {!incident.resolved_at && (
                    <Button
                      data-testid="resolve-incident"
                      size="sm"
                      variant="outline"
                      onClick={() => resolve.mutate(incident.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {incidents.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No incidents. System running smoothly.
        </p>
      )}
    </div>
  );
}
