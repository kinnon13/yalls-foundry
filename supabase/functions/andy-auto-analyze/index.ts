import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Background service: Continuously analyze and expand ALL user memories
// This should be called via cron or periodically
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('🤖 Andy 24/7 background analysis starting...');

    // Get all active users (those who have opted in)
    const { data: activeUsers } = await supabase
      .from('ai_preferences')
      .select('user_id, super_mode')
      .eq('super_mode', true);

    if (!activeUsers || activeUsers.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: 'No active users' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📊 Processing ${activeUsers.length} active users`);
    let processed = 0;

    for (const user of activeUsers) {
      try {
        // 1. Expand memory connections
        await supabase.functions.invoke('andy-expand-memory', {
          body: { user_id: user.user_id }
        });

        // 2. Deep analyze recent unanalyzed knowledge
        const { data: knowledge } = await supabase
          .from('rocker_knowledge')
          .select('id, content')
          .eq('user_id', user.user_id)
          .is('metadata->analyzed', null)
          .order('created_at', { ascending: false })
          .limit(3);

        if (knowledge && knowledge.length > 0) {
          for (const k of knowledge) {
            await supabase.functions.invoke('rocker-deep-analyze', {
              body: { content: k.content, user_id: user.user_id }
            });
            
            // Mark as analyzed
            await supabase
              .from('rocker_knowledge')
              .update({ metadata: { analyzed: true, analyzed_at: new Date().toISOString() } })
              .eq('id', k.id);
          }
        }

        // 3. Analyze conversation patterns
        const { data: recentConvos } = await supabase
          .from('rocker_conversations')
          .select('content, role, created_at')
          .eq('user_id', user.user_id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (recentConvos && recentConvos.length > 5) {
          await supabase.functions.invoke('analyze-memories', {
            body: { user_id: user.user_id }
          });
        }

        processed++;
        console.log(`✅ Processed user ${user.user_id}`);
        
        // Rate limit: small delay between users
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error(`Failed to process user ${user.user_id}:`, e);
      }
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      users_processed: processed,
      total_users: activeUsers.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in andy-auto-analyze:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
