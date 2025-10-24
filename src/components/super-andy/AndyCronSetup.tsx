/**
 * Andy Cron Setup Instructions
 * Guide for setting up automated learning loops
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function AndyCronSetup() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL;
  const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const cronJobs = [
    {
      id: 'external-learning',
      name: 'External Learning Loop',
      schedule: '0 */4 * * *',
      scheduleHuman: 'Every 4 hours',
      function: 'super-andy-learn-external',
      description: 'Andy researches and learns from external sources (web, files)',
      sql: `SELECT cron.schedule(
  'andy-external-learning',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url:='${PROJECT_URL}/functions/v1/super-andy-learn-external',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${ANON_KEY}"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);`
    },
    {
      id: 'aggregate-learnings',
      name: 'Aggregate Learnings',
      schedule: '0 */2 * * *',
      scheduleHuman: 'Every 2 hours',
      function: 'aggregate-learnings',
      description: 'Andy consolidates and merges related memories',
      sql: `SELECT cron.schedule(
  'andy-aggregate-learnings',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url:='${PROJECT_URL}/functions/v1/aggregate-learnings',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${ANON_KEY}"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);`
    },
    {
      id: 'memory-expansion',
      name: 'Memory Expansion',
      schedule: '0 */6 * * *',
      scheduleHuman: 'Every 6 hours',
      function: 'andy-expand-memory',
      description: 'Andy expands and enriches existing memories with context',
      sql: `SELECT cron.schedule(
  'andy-memory-expansion',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url:='${PROJECT_URL}/functions/v1/andy-expand-memory',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${ANON_KEY}"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);`
    },
    {
      id: 'research-queue',
      name: 'Research Queue Processor',
      schedule: '*/30 * * * *',
      scheduleHuman: 'Every 30 minutes',
      function: 'andy-process-research',
      description: 'Andy processes pending research items from the queue',
      sql: `SELECT cron.schedule(
  'andy-research-queue',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='${PROJECT_URL}/functions/v1/andy-process-research',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${ANON_KEY}"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);`
    }
  ];

  const copySQL = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('SQL copied to clipboard');
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4" />
          Andy's Cron Jobs Setup
        </h3>
        <p className="text-xs text-muted-foreground">
          Run these SQL commands in your Supabase SQL Editor to enable Andy's automated learning loops.
        </p>
      </div>

      <div className="space-y-4">
        {cronJobs.map((job) => (
          <Card key={job.id} className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium">{job.name}</p>
                <p className="text-xs text-muted-foreground">{job.description}</p>
              </div>
              <Badge variant="outline">{job.scheduleHuman}</Badge>
            </div>
            
            <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
              <pre className="whitespace-pre-wrap break-all">{job.sql}</pre>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="w-full mt-2"
              onClick={() => copySQL(job.sql, job.id)}
            >
              {copiedId === job.id ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy SQL
                </>
              )}
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded text-xs">
        <p className="font-medium mb-1">📋 How to set up:</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Open your Lovable Cloud backend (SQL Editor)</li>
          <li>Enable pg_cron extension: <code className="bg-muted px-1 py-0.5 rounded">CREATE EXTENSION IF NOT EXISTS pg_cron;</code></li>
          <li>Enable pg_net extension: <code className="bg-muted px-1 py-0.5 rounded">CREATE EXTENSION IF NOT EXISTS pg_net;</code></li>
          <li>Copy and run each SQL command above (one at a time)</li>
          <li>Verify with: <code className="bg-muted px-1 py-0.5 rounded">SELECT * FROM cron.job;</code></li>
        </ol>
      </div>
    </Card>
  );
}
