import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Andy Thought Stream - Real-time visibility into Andy's brain
 * Emits Server-Sent Events showing what Andy is thinking/doing
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_id required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        send('connected', { timestamp: new Date().toISOString() });

        // Stream 1: Check recent memories
        send('lookup', { 
          source: '🧠 Memory', 
          action: 'Scanning long-term memory...',
          icon: 'brain'
        });

        const { data: memories, error: memError } = await supabase
          .from('rocker_long_memory')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (memError) throw memError;

        send('result', {
          source: '🧠 Memory',
          count: memories?.length || 0,
          preview: memories?.slice(0, 3).map((m: any) => m.key).join(', ')
        });

        // Stream 2: Check knowledge base
        send('lookup', {
          source: '📚 Knowledge',
          action: 'Indexing knowledge base...',
          icon: 'book'
        });

        const { data: knowledge, error: kError } = await supabase
          .from('rocker_knowledge')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(10);

        if (kError) throw kError;

        send('result', {
          source: '📚 Knowledge',
          count: knowledge?.length || 0,
          preview: knowledge?.slice(0, 3).map((k: any) => k.title || k.file_path).join(', ')
        });

        // Stream 3: Check active tasks
        send('lookup', {
          source: '✅ Tasks',
          action: 'Monitoring task queue...',
          icon: 'check'
        });

        const { data: tasks, error: tError } = await supabase
          .from('rocker_tasks_v2')
          .select('*')
          .eq('owner_id', userId)
          .in('status', ['open', 'doing'])
          .order('created_at', { ascending: false })
          .limit(10);

        if (tError) throw tError;

        send('result', {
          source: '✅ Tasks',
          count: tasks?.length || 0,
          active: tasks?.filter((t: any) => t.status === 'doing').length || 0
        });

        // Stream 4: Check recent notes
        send('lookup', {
          source: '📝 Notes',
          action: 'Reading research notes...',
          icon: 'note'
        });

        const { data: notes, error: nError } = await supabase
          .from('andy_notes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (nError) throw nError;

        send('result', {
          source: '📝 Notes',
          count: notes?.length || 0,
          recent: notes?.[0]?.title || 'None'
        });

        // Stream 5: Check AI action log
        send('lookup', {
          source: '🤖 Activity',
          action: 'Analyzing recent actions...',
          icon: 'activity'
        });

        const { data: actions, error: aError } = await supabase
          .from('ai_action_ledger')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(20);

        if (aError) throw aError;

        const successRate = actions?.length 
          ? (actions.filter((a: any) => a.result === 'success').length / actions.length * 100).toFixed(1)
          : 0;

        send('result', {
          source: '🤖 Activity',
          total_actions: actions?.length || 0,
          success_rate: `${successRate}%`,
          last_action: actions?.[0]?.action || 'None'
        });

        // Final summary
        send('complete', {
          summary: {
            memories: memories?.length || 0,
            knowledge: knowledge?.length || 0,
            tasks: tasks?.length || 0,
            notes: notes?.length || 0,
            actions: actions?.length || 0
          },
          timestamp: new Date().toISOString()
        });

        controller.close();

      } catch (error: any) {
        send('error', { message: error.message });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
});
