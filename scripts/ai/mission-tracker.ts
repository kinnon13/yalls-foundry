#!/usr/bin/env -S deno run -A
/**
 * 🎯 Super Andy Mission Tracker
 * Updates task status and tracks mission progress
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { header, line } from "../lib/logger.ts";
import { green, yellow, red } from "../lib/colors.ts";

const url = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error(red("❌ Missing Supabase credentials"));
  Deno.exit(1);
}

const supabase = createClient(url, key);

header("SUPER ANDY MISSION TRACKER");

// Get command line args
const command = Deno.args[0];
const taskId = Deno.args[1];

if (!command || !taskId) {
  console.log("Usage: mission-tracker.ts <command> <task-id>");
  console.log("\nCommands:");
  console.log("  done <task-id>     - Mark task as complete");
  console.log("  block <task-id>    - Mark task as blocked");
  console.log("  start <task-id>    - Mark task as in progress");
  console.log("  list              - List all tasks");
  console.log("  stats             - Show task statistics");
  Deno.exit(0);
}

switch (command) {
  case "done": {
    const { error } = await supabase.from("mission_tasks")
      .update({ 
        status: "done", 
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", taskId);

    if (error) {
      console.error(red(`❌ Failed to mark task as done: ${error.message}`));
    } else {
      console.log(green(`✅ Task ${taskId} marked as done`));
      await supabase.from("mission_logs").insert({
        level: "info",
        message: "Task completed",
        task_id: taskId
      });
    }
    break;
  }

  case "block": {
    const { error } = await supabase.from("mission_tasks")
      .update({ status: "blocked", updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) {
      console.error(red(`❌ Failed to mark task as blocked: ${error.message}`));
    } else {
      console.log(yellow(`⚠️  Task ${taskId} marked as blocked`));
      await supabase.from("mission_logs").insert({
        level: "warn",
        message: "Task blocked",
        task_id: taskId
      });
    }
    break;
  }

  case "start": {
    const { error } = await supabase.from("mission_tasks")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) {
      console.error(red(`❌ Failed to start task: ${error.message}`));
    } else {
      console.log(green(`▶️  Task ${taskId} started`));
      await supabase.from("mission_logs").insert({
        level: "info",
        message: "Task started",
        task_id: taskId
      });
    }
    break;
  }

  case "list": {
    const { data: tasks } = await supabase.from("mission_tasks")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (!tasks || tasks.length === 0) {
      console.log(yellow("No tasks found"));
    } else {
      console.log(`\n📋 All Tasks (${tasks.length}):\n`);
      for (const task of tasks) {
        const statusEmoji = task.status === "done" ? "✅" : task.status === "in_progress" ? "▶️" : task.status === "blocked" ? "🚫" : "⏸️";
        const priorityEmoji = task.priority === "critical" ? "🔴" : task.priority === "high" ? "🟠" : task.priority === "medium" ? "🟡" : "🟢";
        console.log(`${statusEmoji} ${priorityEmoji} [${task.status}] ${task.title}`);
        console.log(`   ID: ${task.id}`);
        if (task.context) console.log(`   Context: ${task.context}`);
        console.log("");
      }
    }
    break;
  }

  case "stats": {
    const { data: tasks } = await supabase.from("mission_tasks").select("status");
    if (tasks) {
      const stats = {
        total: tasks.length,
        open: tasks.filter(t => t.status === "open").length,
        in_progress: tasks.filter(t => t.status === "in_progress").length,
        done: tasks.filter(t => t.status === "done").length,
        blocked: tasks.filter(t => t.status === "blocked").length
      };
      
      console.log("\n📊 Task Statistics:\n");
      console.log(`Total Tasks:     ${stats.total}`);
      console.log(`Open:            ${stats.open}`);
      console.log(`In Progress:     ${stats.in_progress}`);
      console.log(`Done:            ${stats.done}`);
      console.log(`Blocked:         ${stats.blocked}`);
      console.log("");
      
      const completion = stats.total > 0 ? ((stats.done / stats.total) * 100).toFixed(1) : 0;
      console.log(green(`Completion Rate: ${completion}%\n`));
    }
    break;
  }

  default:
    console.log(red(`Unknown command: ${command}`));
}

line();