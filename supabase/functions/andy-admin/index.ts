import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify super admin
    const { data: isSuperAdmin } = await supabaseClient.rpc('is_super_admin', {
      _user_id: user.id,
    });

    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Requires super admin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, user_id, reason } = await req.json();

    // Log access
    if (action !== 'list_users') {
      await supabaseClient.from('ai_knower_access_log').insert({
        admin_id: user.id,
        accessed_user_id: user_id,
        access_type: action,
        reason: reason || 'Andy query',
      });
    }

    switch (action) {
      case 'list_users': {
        const { data: profiles } = await supabaseClient
          .from('profiles')
          .select('user_id, display_name, bio, created_at')
          .order('created_at', { ascending: false })
          .limit(100);

        // Get memory counts
        const userIds = profiles?.map(p => p.user_id) || [];
        const { data: memoryCounts } = await supabaseClient
          .from('ai_user_memory')
          .select('user_id')
          .in('user_id', userIds);

        const counts = (memoryCounts || []).reduce((acc: any, m: any) => {
          acc[m.user_id] = (acc[m.user_id] || 0) + 1;
          return acc;
        }, {});

        const enriched = profiles?.map(p => ({
          ...p,
          memory_count: counts[p.user_id] || 0,
        }));

        return new Response(JSON.stringify({ users: enriched }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'view_profile': {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', user_id)
          .single();

        return new Response(JSON.stringify({ profile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'view_conversations': {
        const { data: sessions } = await supabaseClient
          .from('ai_sessions')
          .select('id, actor_role, started_at, ended_at, params')
          .eq('user_id', user_id)
          .order('started_at', { ascending: false })
          .limit(50);

        // Get messages for recent sessions
        const sessionIds = sessions?.map(s => s.id).slice(0, 10) || [];
        const { data: messages } = await supabaseClient.functions.invoke('chat-store', {
          body: { action: 'get_sessions', session_ids: sessionIds },
        });

        return new Response(JSON.stringify({ sessions, messages: messages?.data || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'view_memories': {
        const { data: memories } = await supabaseClient
          .from('ai_user_memory')
          .select('id, type, key, value, confidence, source, created_at, use_count, pinned')
          .eq('user_id', user_id)
          .order('pinned', { ascending: false })
          .order('use_count', { ascending: false })
          .limit(200);

        // Group by type
        const grouped = (memories || []).reduce((acc: any, m: any) => {
          const type = m.type || 'other';
          if (!acc[type]) acc[type] = [];
          acc[type].push(m);
          return acc;
        }, {});

        return new Response(JSON.stringify({ memories: grouped }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_analytics': {
        const { data: analytics } = await supabaseClient
          .from('ai_user_analytics')
          .select('*')
          .eq('user_id', user_id)
          .order('calculated_at', { ascending: false })
          .limit(50);

        return new Response(JSON.stringify({ analytics }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('Andy admin error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
