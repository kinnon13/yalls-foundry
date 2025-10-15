import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const intent = url.searchParams.get('intent');
    const scope = url.searchParams.get('scope');
    
    if (!intent) {
      return new Response(
        JSON.stringify({ error: 'Intent required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    console.log('[KB Playbook] Looking for:', intent, 'scope:', scope);

    // Build query with scope precedence: user > site > global
    let query = supabaseClient
      .from('playbooks')
      .select('*')
      .ilike('intent', `%${intent}%`);

    if (scope) {
      query = query.eq('scope', scope);
      if (scope === 'user' && user) {
        query = query.eq('tenant_id', user.id);
      }
    }

    query = query.order('scope', { ascending: false }) // user first, then site, then global
      .order('version', { ascending: false })
      .limit(1);

    const { data: playbook, error } = await query.maybeSingle();

    if (error) {
      console.error('[KB Playbook] Error:', error);
      throw error;
    }

    if (!playbook) {
      console.log('[KB Playbook] Not found');
      return new Response(
        JSON.stringify({ 
          found: false,
          intent,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[KB Playbook] Found:', playbook.id, 'scope:', playbook.scope);

    return new Response(
      JSON.stringify({ 
        found: true,
        playbook,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[KB Playbook] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
