// Proactive Notifier: Pushes autonomous messages to active threads
// Called by background jobs when they complete audits, research, or discover insights
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log('[rocker-proactive-notifier] boot');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  user_id: string;
  thread_id?: string; // Optional - will use most recent if not specified
  message: string;
  sources?: Array<{ id: string; kind: string; key: string }>;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const { user_id, thread_id, message, sources, metadata }: NotificationRequest = await req.json();

    // Get or create thread
    let targetThreadId = thread_id;
    if (!targetThreadId) {
      const { data: recentThread } = await supabase
        .from('rocker_threads')
        .select('id')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentThread) {
        targetThreadId = recentThread.id;
      } else {
        // Create new thread
        const { data: newThread, error: threadErr } = await supabase
          .from('rocker_threads')
          .insert({ user_id, title: 'Rocker Autonomous Actions' })
          .select('id')
          .single();
        
        if (threadErr) throw threadErr;
        targetThreadId = newThread.id;
      }
    }

    // Insert proactive message
    const { data: msg, error: msgErr } = await supabase
      .from('rocker_messages')
      .insert({
        thread_id: targetThreadId,
        role: 'assistant',
        content: message,
        meta: {
          sources,
          proactive: true,
          ...metadata
        }
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    console.log('[Proactive] Message sent:', {
      thread_id: targetThreadId,
      message_preview: message.substring(0, 100),
    });

    return new Response(
      JSON.stringify({
        success: true,
        thread_id: targetThreadId,
        message_id: msg.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e: any) {
    console.error('[rocker-proactive-notifier] error:', e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
