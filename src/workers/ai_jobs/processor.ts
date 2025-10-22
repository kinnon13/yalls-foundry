/**
 * AI Jobs Processor
 * Polls for pending events and routes to handlers
 */

import { supabase } from '@/integrations/supabase/client';
import { markEventProcessing, markEventDone, markEventFailed } from './queue';

export type EventHandler = (payload: any, eventId: string) => Promise<void>;

const handlers: Map<string, EventHandler> = new Map();

/**
 * Register an event handler for a topic
 */
export function registerHandler(topic: string, handler: EventHandler): void {
  handlers.set(topic, handler);
  console.log(`[Processor] Registered handler for topic: ${topic}`);
}

/**
 * Process a single event
 */
async function processEvent(event: any): Promise<boolean> {
  const { id, topic, payload } = event;
  
  const handler = handlers.get(topic);
  if (!handler) {
    console.warn(`[Processor] No handler for topic: ${topic}`);
    await markEventFailed(id, { error: 'No handler registered' }, 3600);
    return false;
  }
  
  try {
    await handler(payload, id);
    await markEventDone(id);
    return true;
  } catch (error: any) {
    console.error(`[Processor] Handler error for ${topic}:`, error);
    await markEventFailed(id, {
      error: error.message || 'Unknown error',
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Poll for pending events and process them
 */
export async function pollAndProcess(batchSize: number = 10): Promise<number> {
  try {
    // Get pending or failed events ready for retry
    const { data: events } = await (supabase as any)
      .from('ai_events')
      .select('*')
      .or(`status.eq.pending,and(status.eq.failed,next_retry_at.lte.${new Date().toISOString()})`)
      .order('created_at', { ascending: true })
      .limit(batchSize);
    
    if (!events || events.length === 0) {
      return 0;
    }
    
    let processed = 0;
    
    for (const event of events) {
      // Check if attempts exceeded
      if (event.attempts >= event.max_attempts) {
        console.warn(`[Processor] Max attempts exceeded for event ${event.id}`);
        continue;
      }
      
      // Mark as processing (optimistic lock)
      const locked = await markEventProcessing(event.id);
      if (!locked) {
        continue; // Another worker got it
      }
      
      const success = await processEvent(event);
      if (success) {
        processed++;
      }
    }
    
    return processed;
  } catch (error) {
    console.error('[Processor] Poll error:', error);
    return 0;
  }
}

/**
 * Start worker loop (call this from a worker script)
 */
export async function startWorker(intervalMs: number = 5000): Promise<void> {
  console.log(`[Processor] Starting worker with ${intervalMs}ms interval`);
  
  const run = async () => {
    const processed = await pollAndProcess();
    if (processed > 0) {
      console.log(`[Processor] Processed ${processed} events`);
    }
  };
  
  // Initial run
  await run();
  
  // Periodic polling
  setInterval(run, intervalMs);
}
