/**
 * Scale Scorecard Component
 * 
 * Real-time dashboard showing billion-scale readiness gates (red/amber/green).
 * Displays SLOs, health checks, capacity metrics, and rate limit violations.
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getHealthStatus, getTableStats } from './metrics';
import { CheckCircle2, AlertCircle, XCircle, Activity, Database, Shield } from 'lucide-react';

type Status = 'green' | 'amber' | 'red';

interface Gate {
  name: string;
  status: Status;
  value: string;
  threshold: string;
}

export function ScaleScorecard() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health-status'],
    queryFn: getHealthStatus,
    refetchInterval: 10000, // Refresh every 10s
  });

  const { data: tableStats } = useQuery({
    queryKey: ['table-stats'],
    queryFn: getTableStats,
    refetchInterval: 60000, // Refresh every 60s
  });

  if (isLoading || !health) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading scale metrics...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate gates based on health data
  const gates: Gate[] = [
    {
      name: 'Database Latency (P95)',
      status: health.latency.db_p95 <= 200 ? 'green' : health.latency.db_p95 <= 400 ? 'amber' : 'red',
      value: `${health.latency.db_p95}ms`,
      threshold: '≤200ms green, ≤400ms amber',
    },
    {
      name: 'Cache Latency (P95)',
      status: health.latency.cache_p95 <= 5 ? 'green' : health.latency.cache_p95 <= 10 ? 'amber' : 'red',
      value: `${health.latency.cache_p95}ms`,
      threshold: '≤5ms green, ≤10ms amber',
    },
    {
      name: 'Rate Limit Violations',
      status: health.violations === 0 ? 'green' : health.violations < 10 ? 'amber' : 'red',
      value: `${health.violations}/hr`,
      threshold: '0 green, <10 amber',
    },
    {
      name: 'Database Health',
      status: health.checks.database ? 'green' : 'red',
      value: health.checks.database ? 'Connected' : 'Down',
      threshold: 'Connected',
    },
    {
      name: 'Edge Functions',
      status: health.checks.edge_functions ? 'green' : 'red',
      value: health.checks.edge_functions ? 'Healthy' : 'Down',
      threshold: 'Healthy',
    },
  ];

  const overallStatus: Status = gates.every(g => g.status === 'green') 
    ? 'green' 
    : gates.some(g => g.status === 'red') 
    ? 'red' 
    : 'amber';

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className={`border-2 ${
        overallStatus === 'green' ? 'border-green-500' : 
        overallStatus === 'amber' ? 'border-amber-500' : 
        'border-red-500'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {overallStatus === 'green' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {overallStatus === 'amber' && <AlertCircle className="h-5 w-5 text-amber-500" />}
              {overallStatus === 'red' && <XCircle className="h-5 w-5 text-red-500" />}
              Billion-Scale Readiness
            </CardTitle>
            <Badge variant={
              overallStatus === 'green' ? 'default' : 
              overallStatus === 'amber' ? 'secondary' : 
              'destructive'
            }>
              {overallStatus.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {overallStatus === 'green' && 'All systems operating within billion-scale SLOs.'}
            {overallStatus === 'amber' && 'Some metrics approaching thresholds. Monitor closely.'}
            {overallStatus === 'red' && 'Critical issues detected. Immediate action required.'}
          </p>
        </CardContent>
      </Card>

      {/* Individual Gates */}
      <div className="grid gap-4 md:grid-cols-2">
        {gates.map((gate) => (
          <Card key={gate.name}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{gate.name}</p>
                  <p className="text-2xl font-bold">{gate.value}</p>
                  <p className="text-xs text-muted-foreground">Target: {gate.threshold}</p>
                </div>
                <div>
                  {gate.status === 'green' && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                  {gate.status === 'amber' && <AlertCircle className="h-6 w-6 text-amber-500" />}
                  {gate.status === 'red' && <XCircle className="h-6 w-6 text-red-500" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Stats */}
      {tableStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Table Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tableStats.slice(0, 5).map((stat: any) => (
                <div key={stat.table_name} className="flex items-center justify-between text-sm">
                  <span className="font-mono">{stat.table_name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{stat.row_count.toLocaleString()} rows</span>
                    <span className="text-muted-foreground">{stat.total_size}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SLO Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Billion-Scale SLOs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>P95 GET Latency:</span>
              <span className="font-mono">≤200ms (edge), ≤400ms (origin)</span>
            </div>
            <div className="flex justify-between">
              <span>P95 POST Latency:</span>
              <span className="font-mono">≤350ms, P99 ≤800ms</span>
            </div>
            <div className="flex justify-between">
              <span>Error Rate:</span>
              <span className="font-mono">&lt;0.5%</span>
            </div>
            <div className="flex justify-between">
              <span>Cache Hit Rate:</span>
              <span className="font-mono">≥80%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
