/**
 * Super Andy Monitoring Dashboard
 * Real-time system health, performance metrics, error tracking
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Activity, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

interface MonitoringMetrics {
  total_requests: number;
  success_rate: number;
  avg_response_time: number;
  active_errors: number;
  requests_last_hour: number;
  functions: {
    name: string;
    calls: number;
    success_rate: number;
    avg_duration: number;
    last_error?: string;
  }[];
}

export function AndyMonitoring() {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function loadMetrics() {
    try {
      // Get last 24h of monitoring data
      const since = new Date(Date.now() - 24*60*60*1000).toISOString();
      
      const { data: logs } = await supabase
        .from('ai_monitoring')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      if (!logs) return;

      const total = logs.length;
      const successful = logs.filter(l => l.status === 'success').length;
      const lastHour = logs.filter(l => 
        new Date(l.created_at).getTime() > Date.now() - 60*60*1000
      ).length;

      const durations = logs
        .filter(l => l.duration_ms)
        .map(l => l.duration_ms);
      const avgDuration = durations.length > 0 
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      // Group by function
      const functionMap = new Map<string, typeof logs>();
      logs.forEach(log => {
        const existing = functionMap.get(log.function_name) || [];
        functionMap.set(log.function_name, [...existing, log]);
      });

      const functions = Array.from(functionMap.entries()).map(([name, calls]) => {
        const successes = calls.filter(c => c.status === 'success').length;
        const avgDur = calls
          .filter(c => c.duration_ms)
          .map(c => c.duration_ms)
          .reduce((a, b) => a + b, 0) / calls.filter(c => c.duration_ms).length;
        
        const lastError = calls.find(c => c.status === 'failed' && c.error_message)?.error_message;

        return {
          name,
          calls: calls.length,
          success_rate: Math.round((successes / calls.length) * 100),
          avg_duration: Math.round(avgDur || 0),
          last_error: lastError
        };
      }).sort((a, b) => b.calls - a.calls);

      const activeErrors = logs.filter(l => 
        l.status === 'failed' && 
        new Date(l.created_at).getTime() > Date.now() - 60*60*1000
      ).length;

      setMetrics({
        total_requests: total,
        success_rate: Math.round((successful / total) * 100),
        avg_response_time: avgDuration,
        active_errors: activeErrors,
        requests_last_hour: lastHour,
        functions
      });
    } catch (error) {
      console.error('Failed to load monitoring metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !metrics) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5" />
          <h3 className="font-semibold">Andy Monitoring</h3>
        </div>
        <div className="text-sm text-muted-foreground">Loading metrics...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h3 className="font-semibold">Andy System Monitoring</h3>
        </div>
        <div className="text-xs text-muted-foreground">Last 24h</div>
      </div>

      {/* Top-level metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Success Rate</div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`h-4 w-4 ${metrics.success_rate > 95 ? 'text-green-500' : 'text-yellow-500'}`} />
            <div className="text-2xl font-bold">{metrics.success_rate}%</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Avg Response</div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <div className="text-2xl font-bold">{metrics.avg_response_time}ms</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Requests (1h)</div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            <div className="text-2xl font-bold">{metrics.requests_last_hour}</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Active Errors</div>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${metrics.active_errors > 0 ? 'text-red-500' : 'text-green-500'}`} />
            <div className="text-2xl font-bold">{metrics.active_errors}</div>
          </div>
        </div>
      </div>

      {/* Function breakdown */}
      <div className="space-y-2">
        <div className="text-sm font-medium mb-2">Function Performance</div>
        {metrics.functions.slice(0, 5).map((fn) => (
          <div key={fn.name} className="flex items-center justify-between py-2 border-t">
            <div className="space-y-1 flex-1">
              <div className="text-sm font-mono">{fn.name}</div>
              <div className="text-xs text-muted-foreground">
                {fn.calls} calls • {fn.avg_duration}ms avg • {fn.success_rate}% success
              </div>
              {fn.last_error && (
                <div className="text-xs text-red-500 truncate max-w-md">
                  Last error: {fn.last_error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
