/**
 * Andy Cron Job Manager
 * Create and manage automated learning loops
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Plus, Trash2, PlayCircle, PauseCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CronJob {
  id: string;
  key: string;
  topic: string;
  schedule: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  jitter_sec: number;
  payload: any;
}

export function AndyCronSetup() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // New job form
  const [newKey, setNewKey] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newSchedule, setNewSchedule] = useState('rate(1h)');
  const [newJitter, setNewJitter] = useState('30');

  const loadJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_cron_jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load cron jobs');
      console.error(error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const createJob = async () => {
    if (!newKey || !newTopic || !newSchedule) {
      toast.error('Please fill in all fields');
      return;
    }

    const now = new Date();
    const { error } = await supabase
      .from('ai_cron_jobs')
      .insert({
        key: newKey,
        cron: newSchedule, // Keep for backwards compat
        topic: newTopic,
        schedule: newSchedule,
        jitter_sec: parseInt(newJitter) || 30,
        enabled: true,
        next_run_at: now.toISOString(),
        payload: {}
      });

    if (error) {
      toast.error('Failed to create job');
      console.error(error);
    } else {
      toast.success('Cron job created');
      setDialogOpen(false);
      setNewKey('');
      setNewTopic('');
      setNewSchedule('rate(1h)');
      setNewJitter('30');
      loadJobs();
    }
  };

  const toggleJob = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('ai_cron_jobs')
      .update({ enabled: !currentState })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update job');
      console.error(error);
    } else {
      toast.success(`Job ${!currentState ? 'enabled' : 'disabled'}`);
      loadJobs();
    }
  };

  const deleteJob = async (id: string) => {
    const { error } = await supabase
      .from('ai_cron_jobs')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete job');
      console.error(error);
    } else {
      toast.success('Job deleted');
      loadJobs();
    }
  };

  const parseScheduleHuman = (schedule: string): string => {
    const match = schedule?.match(/^rate\((\d+)([smh])\)$/i);
    if (!match) return schedule;
    const num = match[1];
    const unit = match[2].toLowerCase();
    if (unit === 's') return `Every ${num} second${num !== '1' ? 's' : ''}`;
    if (unit === 'm') return `Every ${num} minute${num !== '1' ? 's' : ''}`;
    if (unit === 'h') return `Every ${num} hour${num !== '1' ? 's' : ''}`;
    return schedule;
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4" />
            Cron Jobs Manager
          </h3>
          <p className="text-xs text-muted-foreground">
            Automated tasks that run on a schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadJobs}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-3 h-3 mr-1" />
                New Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Cron Job</DialogTitle>
                <DialogDescription>
                  Schedule a new automated task
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="key">Job Key</Label>
                  <Input
                    id="key"
                    placeholder="andy-daily-summary"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="topic">Topic (Edge Function)</Label>
                  <Input
                    id="topic"
                    placeholder="super-andy-learn-external"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input
                    id="schedule"
                    placeholder="rate(1h)"
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: rate(Ns|Nm|Nh) - e.g. rate(30m), rate(2h), rate(60s)
                  </p>
                </div>
                <div>
                  <Label htmlFor="jitter">Jitter (seconds)</Label>
                  <Input
                    id="jitter"
                    type="number"
                    placeholder="30"
                    value={newJitter}
                    onChange={(e) => setNewJitter(e.target.value)}
                  />
                </div>
                <Button onClick={createJob} className="w-full">
                  Create Job
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No cron jobs configured yet. Create one to get started!
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{job.key}</p>
                    <Badge variant={job.enabled ? "default" : "secondary"} className="text-xs">
                      {job.enabled ? 'Active' : 'Paused'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {parseScheduleHuman(job.schedule)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Topic: <code className="bg-muted px-1 py-0.5 rounded">{job.topic}</code>
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {job.last_run_at && (
                      <span>Last: {new Date(job.last_run_at).toLocaleString()}</span>
                    )}
                    {job.next_run_at && (
                      <span>Next: {new Date(job.next_run_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleJob(job.id, job.enabled)}
                  >
                    {job.enabled ? (
                      <PauseCircle className="w-4 h-4" />
                    ) : (
                      <PlayCircle className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteJob(job.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded text-xs">
        <p className="font-medium mb-1">ℹ️ How it works:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Jobs are processed by the <code className="bg-muted px-1 py-0.5 rounded">cron_tick</code> function</li>
          <li>The topic should match an edge function name</li>
          <li>Jobs with jitter will run at slightly randomized times</li>
          <li>Paused jobs won't execute until re-enabled</li>
        </ul>
      </div>
    </Card>
  );
}
