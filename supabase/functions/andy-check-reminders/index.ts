/**
 * Andy Reminder Checker
 * Cron job that checks for due reminders/tasks and notifies Andy to follow up
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[andy-check-reminders] Starting reminder check...');

    const now = new Date().toISOString();

    // Check for tasks with due_at in the past that haven't been reminded yet
    const { data: dueTasks } = await supabase
      .from('rocker_tasks')
      .select('id, user_id, title, due_at, meta')
      .lte('due_at', now)
      .not('meta->reminded', 'eq', true)
      .in('status', ['open', 'doing'])
      .limit(50);

    console.log('[andy-check-reminders] Found', dueTasks?.length || 0, 'due tasks');

    if (dueTasks && dueTasks.length > 0) {
      for (const task of dueTasks) {
        // Insert a system message for Andy to see
        await supabase.from('rocker_messages').insert({
          user_id: task.user_id,
          role: 'system',
          content: `⏰ REMINDER: Task "${task.title}" was due at ${new Date(task.due_at).toLocaleString()}. Follow up with user.`,
          meta: {
            task_id: task.id,
            reminder_type: 'task_due',
            triggered_at: now
          }
        });

        // Mark task as reminded
        await supabase
          .from('rocker_tasks')
          .update({
            meta: { ...task.meta, reminded: true, reminded_at: now }
          })
          .eq('id', task.id);

        console.log('[andy-check-reminders] Sent reminder for task:', task.id);
      }
    }

    // Check rocker_long_memory for scheduled reminders
    const { data: scheduledReminders } = await supabase
      .from('rocker_long_memory')
      .select('id, user_id, key, value, tags')
      .eq('kind', 'note')
      .contains('tags', ['reminder', 'scheduled'])
      .limit(50);

    if (scheduledReminders && scheduledReminders.length > 0) {
      for (const reminder of scheduledReminders) {
        const reminderTime = reminder.value?.remind_at;
        if (reminderTime && new Date(reminderTime) <= new Date()) {
          // Send reminder message
          await supabase.from('rocker_messages').insert({
            user_id: reminder.user_id,
            role: 'system',
            content: `⏰ REMINDER: ${reminder.value?.text || reminder.key}`,
            meta: {
              memory_id: reminder.id,
              reminder_type: 'scheduled_note',
              triggered_at: now
            }
          });

          // Remove reminder tag so it doesn't trigger again
          const updatedTags = (reminder.tags || []).filter((t: string) => t !== 'scheduled');
          await supabase
            .from('rocker_long_memory')
            .update({ tags: updatedTags })
            .eq('id', reminder.id);

          console.log('[andy-check-reminders] Sent scheduled reminder:', reminder.id);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      tasks_reminded: dueTasks?.length || 0,
      scheduled_reminded: scheduledReminders?.filter(r => 
        r.value?.remind_at && new Date(r.value.remind_at) <= new Date()
      ).length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[andy-check-reminders] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
