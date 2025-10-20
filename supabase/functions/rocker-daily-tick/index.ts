/**
 * Rocker Daily Tick - Proactive Messaging Cron
 * Runs hourly to send check-ins, wraps, task nudges
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch runtime flags
    const { data: flags } = await supabase
      .from("runtime_flags")
      .select("key, value")
      .in("key", [
        "rocker.always_on",
        "rocker.daily_checkin",
        "rocker.evening_wrap",
        "rocker.task_nag",
        "rocker.channel.web",
        "rocker.channel.whatsapp"
      ]);

    const flagMap = (flags || []).reduce((acc, f) => {
      acc[f.key] = f.value;
      return acc;
    }, {} as Record<string, any>);

    if (!flagMap["rocker.always_on"]?.enabled) {
      return new Response(JSON.stringify({ ok: true, message: "Always-on disabled" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const hour = now.getHours();
    const sent: string[] = [];

    // Get active users with voice preferences
    const { data: users } = await supabase
      .from("voice_preferences")
      .select("user_id, channel, target, verified")
      .eq("verified", true);

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No active users" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    for (const userPref of users) {
      const userId = userPref.user_id;
      
      // Morning check-in
      if (
        hour >= (flagMap["rocker.daily_checkin"]?.hour || 9) - 1 &&
        hour <= (flagMap["rocker.daily_checkin"]?.hour || 9) &&
        flagMap["rocker.daily_checkin"]?.enabled
      ) {
        // Check if already sent today
        const today = now.toISOString().split("T")[0];
        const { data: existingMsg } = await supabase
          .from("messages")
          .select("id")
          .eq("user_id", userId)
          .eq("role", "assistant")
          .gte("created_at", today + "T00:00:00")
          .eq("meta->>source", "rocker")
          .eq("meta->>type", "daily_checkin")
          .maybeSingle();

        if (!existingMsg) {
          await supabase.rpc("rocker_dm", {
            p_user_id: userId,
            p_text: "Good morning! Want a 2-minute plan? I can list your top 3 tasks and DM intros to unblock them.",
            p_channel: userPref.channel
          });
          sent.push(`${userId}: morning checkin`);
        }
      }

      // Evening wrap
      if (
        hour >= (flagMap["rocker.evening_wrap"]?.hour || 20) - 1 &&
        hour <= (flagMap["rocker.evening_wrap"]?.hour || 20) &&
        flagMap["rocker.evening_wrap"]?.enabled
      ) {
        const today = now.toISOString().split("T")[0];
        const { data: existingWrap } = await supabase
          .from("messages")
          .select("id")
          .eq("user_id", userId)
          .eq("role", "assistant")
          .gte("created_at", today + "T00:00:00")
          .eq("meta->>source", "rocker")
          .eq("meta->>type", "evening_wrap")
          .maybeSingle();

        if (!existingWrap) {
          await supabase.rpc("rocker_dm", {
            p_user_id: userId,
            p_text: "Evening wrap: How did today go? Want me to queue tomorrow's priorities?",
            p_channel: userPref.channel
          });
          sent.push(`${userId}: evening wrap`);
        }
      }

      // Task nudges
      if (flagMap["rocker.task_nag"]?.enabled) {
        const intervalMin = flagMap["rocker.task_nag"]?.interval_min || 120;
        const cutoff = new Date(now.getTime() - intervalMin * 60 * 1000).toISOString();

        // Find overdue tasks
        const { data: overdueTasks } = await supabase
          .from("rocker_tasks")
          .select("id, title, due_at")
          .eq("user_id", userId)
          .eq("status", "pending")
          .lt("due_at", now.toISOString())
          .order("due_at", { ascending: true })
          .limit(3);

        if (overdueTasks && overdueTasks.length > 0) {
          // Check if we already nudged recently
          const { data: recentNudge } = await supabase
            .from("task_nudges")
            .select("id")
            .eq("user_id", userId)
            .gte("sent_at", cutoff)
            .maybeSingle();

          if (!recentNudge) {
            const taskList = overdueTasks.map(t => `• ${t.title}`).join("\n");
            await supabase.rpc("rocker_dm", {
              p_user_id: userId,
              p_text: `You have ${overdueTasks.length} overdue task(s):\n\n${taskList}\n\nWant me to move them forward or reschedule?`,
              p_channel: userPref.channel
            });

            // Log nudges
            for (const task of overdueTasks) {
              await supabase.from("task_nudges").insert({
                user_id: userId,
                task_id: task.id,
                nudge_type: "overdue",
              });
            }
            sent.push(`${userId}: task nudge (${overdueTasks.length})`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, count: sent.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("rocker-daily-tick error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
