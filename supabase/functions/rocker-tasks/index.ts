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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, task_id, title, status, due_at, thread_id } = await req.json();

    let result;
    switch (action) {
      case 'list': {
        const { data, error } = await supabase
          .from('rocker_tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        result = { tasks: data };
        break;
      }

      case 'create': {
        if (!title) {
          return new Response(JSON.stringify({ error: 'Missing title' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabase
          .from('rocker_tasks')
          .insert({
            user_id: user.id,
            thread_id,
            title,
            status: status || 'open',
            due_at: due_at || null
          })
          .select()
          .single();
        
        if (error) throw error;
        result = { task: data };
        break;
      }

      case 'update': {
        if (!task_id) {
          return new Response(JSON.stringify({ error: 'Missing task_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updates: any = { updated_at: new Date().toISOString() };
        if (status) updates.status = status;
        if (due_at !== undefined) updates.due_at = due_at;

        const { data, error } = await supabase
          .from('rocker_tasks')
          .update(updates)
          .eq('id', task_id)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        result = { task: data };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Tasks error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});