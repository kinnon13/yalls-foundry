/**
 * Worker Jobs Admin Panel
 * View jobs, DLQ, and retry failed jobs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react';

export default function WorkersAdmin() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['worker-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worker_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data;
    },
  });

  const { data: dlq = [] } = useQuery({
    queryKey: ['dead-letter-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dead_letter_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const pending = jobs.filter((j) => j.status === 'pending');
  const running = jobs.filter((j) => j.status === 'running');
  const completed = jobs.filter((j) => j.status === 'completed');
  const failed = jobs.filter((j) => j.status === 'failed');

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-6">Worker Jobs</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-2xl font-bold">{pending.length}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{running.length}</div>
          <div className="text-sm text-muted-foreground">Running</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{completed.length}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{failed.length}</div>
          <div className="text-sm text-muted-foreground">Failed</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{dlq.length}</div>
          <div className="text-sm text-muted-foreground">DLQ</div>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failed.length})</TabsTrigger>
          <TabsTrigger value="dlq">DLQ ({dlq.length})</TabsTrigger>
          <TabsTrigger value="all">All ({jobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </TabsContent>

        <TabsContent value="failed" className="space-y-3 mt-4">
          {failed.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </TabsContent>

        <TabsContent value="dlq" className="space-y-3 mt-4">
          {dlq.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="font-mono text-sm font-semibold">{item.job_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.attempts} attempts
                    </span>
                  </div>
                  <p className="text-sm text-destructive mb-2">{item.error}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JobCard({ job }: { job: any }) {
  const statusIcon = {
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
    running: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
    completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    failed: <AlertCircle className="w-4 h-4 text-destructive" />,
    dlq: <AlertCircle className="w-4 h-4 text-destructive" />,
  }[job.status];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {statusIcon}
            <span className="font-mono text-sm font-semibold">{job.job_type}</span>
            <span className="text-xs text-muted-foreground">
              Attempt {job.attempts}/{job.max_attempts}
            </span>
          </div>
          {job.error && (
            <p className="text-sm text-destructive mb-2">{job.error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Card>
  );
}
