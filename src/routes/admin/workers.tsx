/**
 * Worker Admin Dashboard (Task 25)
 * Production-grade worker monitoring with Mac polish
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/system/Skeleton';
import type { WorkerJob } from '@/types/domain';
import { Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function WorkerAdmin() {
  const { data: jobs = [], isLoading } = useQuery<WorkerJob[]>({
    queryKey: ['worker-jobs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('worker_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as WorkerJob[];
    },
    refetchInterval: 10000, // Auto-refresh every 10s
  });

  const stats = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    running: jobs.filter((j) => j.status === 'running').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
    dlq: jobs.filter((j) => j.status === 'dlq').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
  };

  const dlqJobs = jobs.filter((j) => j.status === 'dlq');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Worker Jobs</h1>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-5 w-5" />} variant="muted" />
          <StatCard label="Running" value={stats.running} icon={<Loader2 className="h-5 w-5 animate-spin" />} variant="primary" />
          <StatCard label="Completed" value={stats.completed} icon={<CheckCircle className="h-5 w-5" />} variant="success" />
          <StatCard label="Failed" value={stats.failed} icon={<XCircle className="h-5 w-5" />} variant="warning" />
          <StatCard label="DLQ" value={stats.dlq} icon={<AlertTriangle className="h-5 w-5" />} variant="destructive" />
        </div>

        {/* Dead Letter Queue Section */}
        {dlqJobs.length > 0 && (
          <section className="rounded-lg border border-destructive/50 bg-card">
            <div className="border-b border-destructive/20 bg-destructive/5 p-4">
              <h2 className="font-medium text-destructive">Dead Letter Queue ({dlqJobs.length})</h2>
            </div>
            <div className="divide-y">
              {dlqJobs.map((job) => (
                <JobRow key={job.id} job={job} isDlq />
              ))}
            </div>
          </section>
        )}

        {/* All Jobs */}
        <section className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-medium text-card-foreground">All Jobs ({jobs.length})</h2>
          </div>
          {jobs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No jobs found</div>
          ) : (
            <div className="divide-y">
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
}

function StatCard({ label, value, icon, variant }: StatCardProps) {
  const variantStyles = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    destructive: 'bg-destructive/10 text-destructive',
    muted: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="rounded-lg border bg-card p-6 text-center transition-shadow hover:shadow-md">
      <div className={`mx-auto mb-3 inline-flex rounded-lg p-3 ${variantStyles[variant]}`}>{icon}</div>
      <div className="text-3xl font-bold text-card-foreground">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

interface JobRowProps {
  job: WorkerJob;
  isDlq?: boolean;
}

function JobRow({ job, isDlq }: JobRowProps) {
  const statusColors = {
    pending: 'bg-muted text-muted-foreground',
    running: 'bg-primary/10 text-primary',
    completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
    failed: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dlq: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className={`flex items-center justify-between p-4 transition-colors hover:bg-muted/50 ${isDlq ? 'bg-destructive/5' : ''}`}>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <span className="font-medium text-card-foreground">{job.job_type}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[job.status]}`}>
            {job.status.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Attempts: {job.attempts}/{job.max_attempts}
          </span>
          <span>
            Next run: {new Date(job.next_run_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        {job.error && (
          <div className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {job.error}
          </div>
        )}
      </div>
      <code className="ml-4 rounded bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
        {job.id.slice(0, 8)}
      </code>
    </div>
  );
}
