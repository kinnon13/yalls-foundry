/**
 * Job Queue Utilities
 * 
 * Helper functions for enqueueing background jobs.
 * Uses the jobs table with outbox pattern for reliability.
 */

import { supabase } from '@/integrations/supabase/client';

export type JobType =
  | 'generate_embeddings'
  | 'process_order'
  | 'send_notification'
  | 'update_metrics'
  | 'sync_inventory'
  | 'cleanup_carts'
  | 'analyze_suggestion'
  | 'implement_suggestion'
  | 'moderate_flag';

export interface JobPayload {
  [key: string]: any;
}

/**
 * Enqueue a background job
 * 
 * Note: TypeScript types will be correct once Supabase types are regenerated
 */
export async function enqueueJob(
  jobType: JobType,
  payload: JobPayload,
  options: {
    scheduledAt?: Date;
    maxAttempts?: number;
  } = {}
): Promise<string | null> {
  try {
    // Using any to bypass type check until Supabase types regenerate
    const { data, error } = await (supabase as any)
      .from('jobs')
      .insert({
        job_type: jobType,
        payload,
        scheduled_at: options.scheduledAt?.toISOString() || new Date().toISOString(),
        max_attempts: options.maxAttempts || 3,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to enqueue job:', error);
      throw error;
    }

    console.log(`Enqueued job ${jobType}:`, data?.id);
    return data?.id || null;
  } catch (error) {
    console.error('Error enqueueing job:', error);
    return null;
  }
}

/**
 * Enqueue embeddings generation for a listing
 */
export async function generateListingEmbeddings(listingId: string, content: string) {
  return enqueueJob('generate_embeddings', {
    chunks: [
      {
        chunk_type: 'listing',
        source_id: listingId,
        source_table: 'marketplace_listings',
        content,
      },
    ],
  });
}

/**
 * Enqueue order processing
 */
export async function processOrder(orderId: string) {
  return enqueueJob('process_order', {
    order_id: orderId,
  });
}

/**
 * Enqueue notification
 */
export async function sendNotification(
  userId: string,
  type: string,
  message: string,
  metadata?: Record<string, any>
) {
  return enqueueJob('send_notification', {
    user_id: userId,
    type,
    message,
    metadata,
  });
}

/**
 * Schedule recurring cart cleanup (call from admin dashboard)
 */
export async function scheduleCartCleanup() {
  // Schedule for next hour
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + 1);

  return enqueueJob('cleanup_carts', {}, { scheduledAt });
}
