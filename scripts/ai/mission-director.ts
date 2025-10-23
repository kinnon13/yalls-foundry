#!/usr/bin/env -S deno run -A
/**
 * 🧠 Super Andy Mission Director
 * The orchestrator brain that manages Andy's tasks and executes mission scans
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { header, line } from "../lib/logger.ts";
import { green, yellow, red } from "../lib/colors.ts";

const url = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error(red("❌ Missing credentials: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required"));
  console.error("   Add to .env or CI environment variables");
  Deno.exit(1);
}

const supabase = createClient(url, key);

header("SUPER ANDY MISSION DIRECTOR");

console.log(green("🚀 Super Andy Director booting...\n"));

// Log startup
await supabase.from("mission_logs").insert({
  level: "info",
  message: "Super Andy Mission Director started",
  context: { timestamp: new Date().toISOString() }
});

// Fetch open tasks
console.log(yellow("📋 Loading open tasks...\n"));
const { data: openTasks, error } = await supabase
  .from("mission_tasks")
  .select("*")
  .eq("status", "open")
  .order("priority", { ascending: false })
  .order("created_at", { ascending: true });

if (error) {
  console.error(red(`❌ Failed to load tasks: ${error.message}`));
  Deno.exit(1);
}

if (!openTasks || openTasks.length === 0) {
  console.log(green("✅ No open tasks - system idle"));
  await supabase.from("mission_logs").insert({
    level: "info",
    message: "No open tasks found - system idle"
  });
  Deno.exit(0);
}

console.log(`Found ${openTasks.length} open task(s):\n`);

for (const task of openTasks) {
  const priorityEmoji = task.priority === "critical" ? "🔴" : task.priority === "high" ? "🟠" : task.priority === "medium" ? "🟡" : "🟢";
  console.log(`${priorityEmoji} [${task.priority}] ${task.title}`);
  if (task.context) console.log(`   Context: ${task.context}`);
  if (task.notes) console.log(`   Notes: ${task.notes}`);
  console.log("");
}

// Execute highest priority task
const task = openTasks[0];
console.log(yellow(`\n🧠 Executing: ${task.title}\n`));

await supabase.from("mission_tasks")
  .update({ status: "in_progress", updated_at: new Date().toISOString() })
  .eq("id", task.id);

await supabase.from("mission_logs").insert({
  level: "info",
  message: `Started task: ${task.title}`,
  task_id: task.id
});

// Task execution logic
try {
  if (task.notes?.includes("master-elon-scan.ts")) {
    console.log("Running master scan...");
    const process = new Deno.Command("deno", {
      args: ["run", "-A", "scripts/master-elon-scan.ts"],
      stdout: "piped",
      stderr: "piped"
    });
    const { code, stdout, stderr } = await process.output();
    
    if (code === 0) {
      console.log(green("\n✅ Master scan completed successfully"));
      await supabase.from("mission_tasks")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", task.id);
      
      await supabase.from("mission_logs").insert({
        level: "info",
        message: `Completed task: ${task.title}`,
        task_id: task.id,
        context: { exitCode: code }
      });
    } else {
      console.error(red("\n❌ Master scan failed"));
      console.error(new TextDecoder().decode(stderr));
      
      await supabase.from("mission_tasks")
        .update({ status: "blocked" })
        .eq("id", task.id);
      
      await supabase.from("mission_logs").insert({
        level: "error",
        message: `Task failed: ${task.title}`,
        task_id: task.id,
        context: { exitCode: code, error: new TextDecoder().decode(stderr) }
      });
    }
  } else if (task.notes?.includes("ping-functions.ts")) {
    console.log("Running health checks...");
    const process = new Deno.Command("deno", {
      args: ["run", "-A", "scripts/health/ping-functions.ts"],
      stdout: "piped",
      stderr: "piped"
    });
    const { code } = await process.output();
    
    if (code === 0) {
      await supabase.from("mission_tasks")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", task.id);
    }
  } else {
    console.log(yellow("⚠️  No automated handler for this task"));
    console.log("   Mark as done manually when complete");
  }
} catch (e) {
  console.error(red(`❌ Task execution error: ${e.message}`));
  await supabase.from("mission_logs").insert({
    level: "error",
    message: `Task execution failed: ${e.message}`,
    task_id: task.id,
    context: { error: e.message }
  });
}

line();
console.log(green("\n🧠 Super Andy Mission Director complete\n"));
