import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Activity, Zap, Database, AlertCircle } from 'lucide-react';

interface SystemHealthData {
  tables: { name: string; ok: boolean }[];
  rpcs: { name: string; ok: boolean }[];
  recentActions: any[];
  timestamp: string;
}

export default function SystemHealthPage() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealthData> => {
      const tables = [
        { name: 'user_segments', ok: false },
        { name: 'entity_segments', ok: false },
        { name: 'ui_theme_overrides', ok: false },
      ];

      const rpcs = [
        { name: 'recommend_workspace_modules', ok: false },
        { name: 'accept_module_recommendation', ok: false },
        { name: 'set_theme_overrides', ok: false },
        { name: 'get_theme', ok: false },
        { name: 'get_workspace_kpis', ok: false },
      ];

      // Test table access
      for (const table of tables) {
        try {
          const { error } = await supabase.from(table.name as any).select('*').limit(1);
          table.ok = !error;
        } catch {
          table.ok = false;
        }
      }

      // Test RPC access (lightweight calls)
      for (const rpc of rpcs) {
        try {
          // Just check if RPC exists by attempting to call it (will fail auth but that's ok)
          await supabase.rpc(rpc.name as any, {});
          rpc.ok = true; // If it doesn't throw "function doesn't exist", it's there
        } catch (e: any) {
          rpc.ok = !e?.message?.includes('does not exist');
        }
      }

      // Get recent AI actions
      const { data: actions } = await supabase
        .from('ai_action_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        tables,
        rpcs,
        recentActions: actions || [],
        timestamp: new Date().toISOString(),
      };
    },
    refetchInterval: 30000,
  });

  const StatusIcon = ({ ok }: { ok: boolean }) =>
    ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Health</h1>
            <p className="text-muted-foreground">Database and runtime diagnostics</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  const allTablesOk = health?.tables.every(t => t.ok) ?? false;
  const allRpcsOk = health?.rpcs.every(r => r.ok) ?? false;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground">Database and runtime diagnostics</p>
        </div>
        <Badge variant={allTablesOk && allRpcsOk ? 'default' : 'destructive'}>
          {allTablesOk && allRpcsOk ? 'All Systems Operational' : 'Issues Detected'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Database Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Tables
            </CardTitle>
            <CardDescription>Phase 2 control plane tables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {health?.tables.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{t.name}</span>
                <StatusIcon ok={t.ok} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Database Functions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              RPC Functions
            </CardTitle>
            <CardDescription>Phase 2-4 secure RPCs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {health?.rpcs.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{r.name}</span>
                <StatusIcon ok={r.ok} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Migration Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Next Steps
            </CardTitle>
            <CardDescription>Required migrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">Apply migrations:</p>
              <code className="text-xs bg-muted p-2 rounded block">
                2025-01-Phase2_control_plane.sql
              </code>
              <code className="text-xs bg-muted p-2 rounded block mt-1">
                2025-01-Phase4_kpi_rpcs.sql
              </code>
            </div>
            <p className="text-muted-foreground text-xs">
              Use Supabase migration tool to apply these idempotent migrations safely.
            </p>
          </CardContent>
        </Card>

        {/* Recent AI Actions */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent AI Actions
            </CardTitle>
            <CardDescription>Last 10 Rocker actions from ai_action_ledger</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health?.recentActions.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent actions</p>
              )}
              {health?.recentActions.map((action) => (
                <div key={action.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {action.agent}
                      </Badge>
                      <span className="font-medium text-sm">{action.action}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(action.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={action.result === 'success' ? 'default' : 'destructive'}>
                    {action.result}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Check:</span>
            <span>{health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tables Checked:</span>
            <span>{health?.tables.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RPCs Checked:</span>
            <span>{health?.rpcs.length || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
