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

    switch (action) {
      case 'list': {
        const { data: tasks, error } = await supabase
          .from('rocker_tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ tasks: tasks || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        if (!title) {
          return new Response(JSON.stringify({ error: 'Missing title' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: task, error } = await supabase
          .from('rocker_tasks')
          .insert({
            user_id: user.id,
            title,
            status: status || 'open',
            due_at,
            thread_id
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ task }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!task_id) {
          return new Response(JSON.stringify({ error: 'Missing task_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updates: any = {};
        if (status !== undefined) updates.status = status;
        if (due_at !== undefined) updates.due_at = due_at;
        if (title !== undefined) updates.title = title;

        const { data: task, error } = await supabase
          .from('rocker_tasks')
          .update(updates)
          .eq('id', task_id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ task }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!task_id) {
          return new Response(JSON.stringify({ error: 'Missing task_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('rocker_tasks')
          .delete()
          .eq('id', task_id)
          .eq('user_id', user.id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error: any) {
    console.error('[rocker-tasks]', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
