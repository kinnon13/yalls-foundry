/**
 * Job Queue Client
 * Schedule background jobs with idempotency
 */

import { supabase } from '@/integrations/supabase/client';

export interface JobPayload {
  jobType: string;
  payload: Record<string, any>;
  idempotencyKey?: string;
  maxAttempts?: number;
  scheduleFor?: Date;
}

export async function enqueueJob({
  jobType,
  payload,
  idempotencyKey,
  maxAttempts = 3,
  scheduleFor = new Date(),
}: JobPayload): Promise<string> {
  const { data, error } = await supabase
    .from('worker_jobs')
    .insert({
      job_type: jobType,
      payload,
      idempotency_key: idempotencyKey,
      max_attempts: maxAttempts,
      next_run_at: scheduleFor.toISOString(),
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    // If duplicate idempotency key, return existing job
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('worker_jobs')
        .select('id')
        .eq('idempotency_key', idempotencyKey!)
        .single();

      if (existing) return existing.id;
    }
    throw error;
  }

  return data.id;
}

export async function getJobStatus(jobId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('worker_jobs')
    .select('status')
    .eq('id', jobId)
    .maybeSingle();

  if (error) throw error;
  return data?.status || null;
}
