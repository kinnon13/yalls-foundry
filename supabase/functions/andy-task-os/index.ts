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

    const { action, task_id, task, filters } = await req.json();

    // LIST: Get all tasks with filters
    if (action === "list") {
      let query = supabase
        .from('rocker_tasks_v2')
        .select(`
          *,
          subtasks:rocker_task_subtasks(id, title, done, order_index),
          comments:rocker_task_comments(id, body, author_type, created_at),
          labels:rocker_task_label_links(label:rocker_task_labels(id, name, color))
        `)
        .eq('owner_id', user.id);

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.priority) query = query.eq('priority', filters.priority);
      if (filters?.project_id) query = query.eq('project_id', filters.project_id);
      if (filters?.entity_id) query = query.eq('entity_id', filters.entity_id);

      query = query.order('created_at', { ascending: false });

      const { data: tasks, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ tasks }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE: Create a new task
    if (action === "create") {
      const { data: newTask, error } = await supabase
        .from('rocker_tasks_v2')
        .insert({
          owner_id: user.id,
          ...task,
        })
        .select()
        .single();

      if (error) throw error;

      // Create subtasks if provided
      if (task.subtasks?.length) {
        const subtasksData = task.subtasks.map((st: any, idx: number) => ({
          task_id: newTask.id,
          title: st.title,
          done: st.done || false,
          order_index: idx,
        }));
        await supabase.from('rocker_task_subtasks').insert(subtasksData);
      }

      return new Response(JSON.stringify({ task: newTask }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE: Update existing task
    if (action === "update") {
      const { data: updatedTask, error } = await supabase
        .from('rocker_tasks_v2')
        .update(task)
        .eq('id', task_id)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ task: updatedTask }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE: Delete a task
    if (action === "delete") {
      const { error } = await supabase
        .from('rocker_tasks_v2')
        .delete()
        .eq('id', task_id)
        .eq('owner_id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TRIAGE: Auto-categorize and prioritize inbox items (AI-powered)
    if (action === "triage") {
      const { data: inboxTasks } = await supabase
        .from('rocker_tasks_v2')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'inbox')
        .order('created_at', { ascending: true })
        .limit(20);

      // Simple heuristic triage (can be enhanced with AI)
      for (const task of inboxTasks || []) {
        let priority = 'normal';
        let status = 'triaged';

        // Urgent keywords
        if (task.title.match(/urgent|asap|critical|emergency/i)) {
          priority = 'urgent';
        } else if (task.title.match(/important|high|soon/i)) {
          priority = 'high';
        } else if (task.title.match(/low|maybe|someday/i)) {
          priority = 'low';
        }

        // Auto-categorize
        let kind = task.kind;
        if (task.title.match(/decide|choose|pick/i)) kind = 'decision';
        else if (task.title.match(/research|find|learn|investigate/i)) kind = 'research';
        else if (task.title.match(/write|create|design|make/i)) kind = 'content';
        else if (task.title.match(/meet|call|discuss/i)) kind = 'meeting';
        else if (task.title.match(/bug|fix|error/i)) kind = 'bug';

        await supabase
          .from('rocker_tasks_v2')
          .update({ priority, status, kind })
          .eq('id', task.id);
      }

      return new Response(JSON.stringify({ triaged: inboxTasks?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PLAN_TODAY: Select top tasks for today
    if (action === "plan_today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get high-priority tasks or tasks due today
      const { data: todayTasks } = await supabase
        .from('rocker_tasks_v2')
        .select('*')
        .eq('owner_id', user.id)
        .in('status', ['triaged', 'planned'])
        .or(`priority.eq.urgent,priority.eq.high,due_at.gte.${today.toISOString()},due_at.lt.${tomorrow.toISOString()}`)
        .order('priority', { ascending: true })
        .limit(5);

      return new Response(JSON.stringify({ today: todayTasks }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");

  } catch (error: any) {
    console.error("[andy-task-os] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
