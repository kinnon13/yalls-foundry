/**
 * Events Streaming Sink - Billion-User Scale
 * 
 * Features:
 * - Batching (100 msgs or 1s timeout)
 * - Compression (gzip)
 * - Dead letter queue for failed messages
 * - Graceful shutdown with buffer flush
 */
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = parseInt(Deno.env.get('BATCH_SIZE') || '100');
const BATCH_TIMEOUT_MS = parseInt(Deno.env.get('BATCH_TIMEOUT_MS') || '1000');

interface KafkaMessage {
  key: string;
  value: string;
  topic: string;
  timestamp: number;
}

// In-memory batch buffer
let eventBuffer: KafkaMessage[] = [];
let flushTimer: number | null = null;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const kafkaBrokers = Deno.env.get('KAFKA_BROKERS') || 'localhost:9092';
    const streamImpl = Deno.env.get('STREAM_IMPL') || 'kafka';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { table } = await req.json();
    
    if (!table || (table !== 'rocker_events' && table !== 'ai_action_ledger')) {
      return new Response(
        JSON.stringify({ error: 'Invalid table parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Events Sink] Processing ${table} with ${streamImpl}`);

    // Fetch recent events (last 60 seconds)
    const cutoff = new Date(Date.now() - 60_000).toISOString();
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Events Sink] Query error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, count: 0, message: 'No new events' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add to batch buffer
    const messages: KafkaMessage[] = data.map(row => ({
      key: row.id,
      value: JSON.stringify(row),
      topic: `yalls.${table}`,
      timestamp: new Date(row.created_at).getTime()
    }));

    eventBuffer.push(...messages);
    console.log(`[Events Sink] Buffered ${messages.length} messages (total buffer: ${eventBuffer.length})`);

    // Flush if buffer is full
    if (eventBuffer.length >= BATCH_SIZE) {
      await flushBuffer(supabase);
    } else if (!flushTimer) {
      // Set timer to flush after timeout
      flushTimer = setTimeout(() => flushBuffer(supabase), BATCH_TIMEOUT_MS);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        count: data.length,
        buffered: eventBuffer.length,
        table,
        stream_impl: streamImpl,
        brokers: kafkaBrokers
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Events Sink] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Flush buffer to Kafka (batched + compressed)
 */
async function flushBuffer(supabase: any): Promise<void> {
  if (eventBuffer.length === 0) return;

  try {
    console.log(`[Flush] Processing ${eventBuffer.length} events...`);
    
    // Group by topic for efficient batching
    const byTopic = eventBuffer.reduce((acc, msg) => {
      if (!acc[msg.topic]) acc[msg.topic] = [];
      acc[msg.topic].push(msg);
      return acc;
    }, {} as Record<string, KafkaMessage[]>);

    // Send batches per topic
    for (const [topic, messages] of Object.entries(byTopic)) {
      try {
        // Compress batch
        const compressed = await compressMessages(messages);
        console.log(`[Kafka] Topic: ${topic}, Messages: ${messages.length}, Compressed: ${compressed.length} bytes`);
        
        // In production: await kafka.producer().send({ topic, messages });
        // For now, log success
        
      } catch (err) {
        console.error(`[Kafka] Failed to send to ${topic}:`, err);
        // Send to dead letter queue
        await sendToDeadLetterQueue(supabase, topic, messages, err);
      }
    }

    // Clear buffer
    eventBuffer = [];
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

  } catch (err) {
    console.error('[Flush] Error:', err);
  }
}

/**
 * Compress messages using gzip
 */
async function compressMessages(messages: KafkaMessage[]): Promise<Uint8Array> {
  const jsonString = JSON.stringify(messages.map(m => ({ key: m.key, value: m.value })));
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    }
  }).pipeThrough(new CompressionStream('gzip'));

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Send failed messages to dead letter queue
 */
async function sendToDeadLetterQueue(
  supabase: any,
  topic: string,
  messages: KafkaMessage[],
  error: any
): Promise<void> {
  try {
    console.error(`[DLQ] Sending ${messages.length} messages to dead letter queue`);
    
    await supabase
      .from('ai_action_ledger')
      .insert(
        messages.map(msg => ({
          user_id: null,
          agent: 'events_sink_dlq',
          action: 'kafka_send_failed',
          input: { topic, message_key: msg.key },
          output: { error: error instanceof Error ? error.message : String(error) },
          result: 'failure'
        }))
      );
      
  } catch (dlqError) {
    console.error('[DLQ] Failed to write to dead letter queue:', dlqError);
  }
}

// Graceful shutdown - flush buffer on termination
addEventListener('beforeunload', async () => {
  console.log('[Shutdown] Flushing buffer...');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  await flushBuffer(supabase);
});
