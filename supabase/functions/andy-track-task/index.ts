import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) throw new Error("Unauthorized");

    const { action, task_id, title, steps, progress, learnings } = await req.json();

    if (action === "create") {
      // Create a new analysis task
      const { data: task, error } = await supabase
        .from('rocker_tasks')
        .insert({
          user_id: user.id,
          title,
          description: `Analysis task with ${steps?.length || 0} steps`,
          status: 'in_progress',
          meta: {
            type: 'analysis',
            steps: steps || [],
            current_step: 0,
            learnings: []
          }
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ task }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_progress") {
      // Update progress on a task
      const { data: task } = await supabase
        .from('rocker_tasks')
        .select('meta')
        .eq('id', task_id)
        .single();

      const updatedMeta = {
        ...task?.meta,
        current_step: progress.current_step,
        learnings: [
          ...(task?.meta?.learnings || []),
          ...(learnings || [])
        ]
      };

      const { error } = await supabase
        .from('rocker_tasks')
        .update({ meta: updatedMeta })
        .eq('id', task_id);

      if (error) throw error;

      // Store learnings in knowledge base
      if (learnings && learnings.length > 0) {
        const knowledgeEntries = learnings.map((learning: string) => ({
          user_id: user.id,
          content: learning,
          chunk_summary: `Learning from analysis task: ${title}`,
          meta: { task_id, type: 'task_learning' }
        }));

        await supabase.from('rocker_knowledge').insert(knowledgeEntries);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "complete") {
      // Mark task as complete
      const { error } = await supabase
        .from('rocker_tasks')
        .update({ 
          status: 'done',
          completed_at: new Date().toISOString()
        })
        .eq('id', task_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");

  } catch (error: any) {
    console.error("[andy-track-task] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
