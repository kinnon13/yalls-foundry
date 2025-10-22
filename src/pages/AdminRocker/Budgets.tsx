/**
 * Admin Rocker - Model Routes & Budgets
 * Configure model routing and monitor budget usage
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState } from 'react';

export default function AdminBudgets() {
  const [testResult, setTestResult] = useState<any>(null);

  const { data: routes = [] } = useQuery({
    queryKey: ['model-routes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_model_routes' as any)
        .select('*')
        .order('task_class', { ascending: true });
      return data ?? [];
    },
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['model-budgets'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_model_budget' as any)
        .select('*')
        .order('model_name', { ascending: true });
      return data ?? [];
    },
  });

  async function testRouter() {
    try {
      const { data, error } = await supabase.functions.invoke('model_router', {
        body: {
          tenantId: null,
          taskClass: 'mdr.generate',
          requiredTokens: 4096,
        },
      });

      if (error) throw error;
      setTestResult(data);
      toast.success('Router test complete');
    } catch (error) {
      toast.error('Router test failed');
      console.error(error);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Model Routes & Budgets</h1>
      <p className="text-muted-foreground mb-6">
        Configure model routing and monitor budget usage.
      </p>

      <div className="space-y-8">
        {/* Model Routes */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Model Routes</h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Class</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Max Tokens</TableHead>
                  <TableHead>Temperature</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route: any) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-mono text-sm">{route.task_class}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{route.model_name}</Badge>
                    </TableCell>
                    <TableCell>{route.max_tokens?.toLocaleString()}</TableCell>
                    <TableCell>{route.temperature}</TableCell>
                    <TableCell>{route.priority}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Budget Usage */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Budget Usage</h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget: any) => {
                  const pct = (budget.spent_usd / budget.monthly_limit_usd) * 100;
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-mono text-sm">{budget.model_name}</TableCell>
                      <TableCell>${budget.spent_usd.toFixed(2)}</TableCell>
                      <TableCell>${budget.monthly_limit_usd.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={pct >= 80 ? 'destructive' : 'default'}>
                          {pct.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Router Test */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Test Model Router</h3>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              Test the model router to see which model would be selected for a given task.
            </p>
            <Button onClick={testRouter}>Test Router</Button>
            {testResult && (
              <pre className="mt-4 p-4 bg-muted rounded-md text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
