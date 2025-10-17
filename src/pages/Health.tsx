import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

export default function Health() {
  const { data, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const start = performance.now();
      
      // Test DB
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      const dbStatus = dbError ? 'down' : 'up';
      const dbLatency = Math.round(performance.now() - start);

      // Get version from env
      const version = import.meta.env.VITE_COMMIT_SHA || 'dev';

      return {
        ok: dbStatus === 'up',
        timestamp: new Date().toISOString(),
        version,
        services: {
          database: dbStatus,
          latency_ms: dbLatency,
        },
      };
    },
    refetchInterval: 10000, // Refresh every 10s
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading health status...</div>
      </div>
    );
  }

  const isHealthy = data?.ok;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">System Health</h1>
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                isHealthy
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
              }`}
            >
              {isHealthy ? '✓ Healthy' : '✗ Degraded'}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Timestamp</div>
              <div className="font-mono">{data?.timestamp}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Version</div>
              <div className="font-mono">{data?.version}</div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Services</h2>
            
            {/* Database */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    data?.services.database === 'up' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="font-medium">Database</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="capitalize">{data?.services.database}</span>
                <span className="font-mono">{data?.services.latency_ms}ms</span>
              </div>
            </div>
          </div>

          {/* JSON Output */}
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Show JSON
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded-lg overflow-auto text-xs font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      </Card>
    </div>
  );
}
