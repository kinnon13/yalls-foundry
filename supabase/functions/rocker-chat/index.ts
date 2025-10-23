/**
 * Rocker Chat - Fallback/wrapper for rocker-chat-simple
 * Provides redundancy: if rocker-chat-simple is down, this can handle basic requests
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    
    console.log('[Rocker Chat] Forwarding to rocker-chat-simple');

    // Try primary function first
    try {
      const { data, error } = await supabase.functions.invoke('rocker-chat-simple', {
        body
      });

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (primaryError) {
      console.error('[Rocker Chat] Primary function failed, using fallback:', primaryError);
      
      // Fallback: basic response
      const { message } = body;
      
      return new Response(JSON.stringify({
        reply: `I received your message: "${message}". However, I'm currently in fallback mode and can't process complex requests. Please try again in a moment.`,
        fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('[Rocker Chat] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
