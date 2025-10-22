/**
 * Admin Rocker - Tools Registry
 * View and manage role-scoped AI tools
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AdminTools() {
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['ai-tools'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_tools' as any)
        .select('*')
        .order('role', { ascending: true });
      return data ?? [];
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading tools...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Tools Registry</h1>
      <p className="text-muted-foreground mb-6">
        Role-scoped AI tools and capabilities registry.
      </p>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool Key</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.map((tool: any) => (
              <TableRow key={tool.id}>
                <TableCell className="font-mono text-sm">{tool.tool_key}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{tool.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tool.config?.description || 'No description'}
                </TableCell>
                <TableCell>
                  <Badge variant={tool.enabled ? 'default' : 'outline'}>
                    {tool.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tools.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No tools registered yet.
          </div>
        )}
      </Card>
    </div>
  );
}
