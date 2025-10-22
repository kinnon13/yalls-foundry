/**
 * Worker Runtime Main Loop
 * NOTE: Workers run as Edge Functions, not in the browser.
 * This file provides types only.
 */

export interface WorkerConfig {
  workerId: string;
  pollInterval: number;
}

export interface JobStatus {
  id: string;
  status: 'queued' | 'running' | 'done' | 'error';
  attempts: number;
}

// Actual worker implementation is in Edge Functions
// See supabase/functions/process-jobs for the real worker loop
