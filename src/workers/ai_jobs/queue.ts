/**
 * AI Jobs Queue Manager
 * Enqueues events for worker processing
 */

import { supabase } from '@/integrations/supabase/client';

export interface JobPayload {
  topic: string;
  payload: Record<string, any>;
  tenantId: string;
  region?: string;
  idempotencyKey?: string;
  maxAttempts?: number;
}

/**
 * Enqueue an AI event for processing
 */
export async function enqueueEvent(job: JobPayload): Promise<string | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('ai_events')
      .insert({
        tenant_id: job.tenantId,
        region: job.region || 'us-west',
        topic: job.topic,
        payload: job.payload,
        idempotency_key: job.idempotencyKey,
        max_attempts: job.maxAttempts || 3,
        status: 'pending',
      })
      .select('id')
      .single();
    
    if (error) {
      // If duplicate idempotency key, return existing
      if (error.code === '23505' && job.idempotencyKey) {
        const { data: existing } = await (supabase as any)
          .from('ai_events')
          .select('id')
          .eq('idempotency_key', job.idempotencyKey)
          .single();
        
        return existing?.id || null;
      }
      
      console.error('[Queue] Error enqueuing event:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('[Queue] Unexpected error:', error);
    return null;
  }
}

/**
 * Get event status
 */
export async function getEventStatus(eventId: string): Promise<string | null> {
  try {
    const { data } = await (supabase as any)
      .from('ai_events')
      .select('status')
      .eq('id', eventId)
      .single();
    
    return data?.status || null;
  } catch (error) {
    console.error('[Queue] Error getting status:', error);
    return null;
  }
}

/**
 * Mark event as processing
 */
export async function markEventProcessing(eventId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('ai_events')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .eq('status', 'pending');
    
    return !error;
  } catch (error) {
    console.error('[Queue] Error marking processing:', error);
    return false;
  }
}

/**
 * Mark event as done
 */
export async function markEventDone(eventId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('ai_events')
      .update({
        status: 'done',
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);
    
    return !error;
  } catch (error) {
    console.error('[Queue] Error marking done:', error);
    return false;
  }
}

/**
 * Mark event as failed with retry
 */
export async function markEventFailed(
  eventId: string,
  errorDetails: any,
  retryAfterSeconds: number = 60
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .rpc('increment_event_attempt', { event_id: eventId });
    
    if (error) {
      console.error('[Queue] Error incrementing attempt:', error);
    }
    
    const nextRetry = new Date(Date.now() + retryAfterSeconds * 1000);
    
    const { error: updateError } = await (supabase as any)
      .from('ai_events')
      .update({
        status: 'failed',
        error: errorDetails,
        next_retry_at: nextRetry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);
    
    return !updateError;
  } catch (error) {
    console.error('[Queue] Error marking failed:', error);
    return false;
  }
}
