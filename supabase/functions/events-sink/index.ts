import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KafkaMessage {
  key: string;
  value: string;
}

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

    // In production, send to Kafka/Pulsar
    // For now, we'll log the events that would be sent
    const messages: KafkaMessage[] = data.map(row => ({
      key: row.id,
      value: JSON.stringify(row)
    }));

    console.log(`[Events Sink] Would send ${messages.length} messages to topic: yalls.${table}`);
    
    // TODO: Implement actual Kafka producer
    // const kafka = new Kafka({ clientId: 'yalls', brokers: kafkaBrokers.split(',') });
    // const producer = kafka.producer();
    // await producer.connect();
    // await producer.send({
    //   topic: `yalls.${table}`,
    //   messages
    // });
    // await producer.disconnect();

    return new Response(
      JSON.stringify({
        ok: true,
        count: data.length,
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
