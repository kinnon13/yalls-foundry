#!/usr/bin/env -S deno run -A
// Compares Supabase config vs. actual deployed edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error("❌ Missing Supabase credentials (SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY)");
  console.error("   Set env vars or add them to CI to enable live validation.");
  Deno.exit(1);
}

const supabase = createClient(url, key);

const { data: functions, error } = await supabase.functions.list();
if (error) {
  console.error("❌ Failed to list remote functions:", error.message);
  Deno.exit(1);
}

// Read local function folders
const local: string[] = [];
for await (const entry of Deno.readDir("supabase/functions")) {
  if (entry.isDirectory && !entry.name.startsWith(".")) local.push(entry.name);
}

const remote = (functions ?? []).map((f: any) => f.name);

const missing = local.filter((l) => !remote.includes(l));
const ghosts = remote.filter((r) => !local.includes(r));

console.log("🧩 Edge Function Verification Report\n");
console.log(`Local functions: ${local.length}`);
console.log(`Remote functions: ${remote.length}`);
console.log(`❌ Missing on remote: ${missing.length}`);
console.log(`👻 Ghosts on remote: ${ghosts.length}`);

await Deno.writeTextFile(
  "scripts/audit/verify-edge-functions.json",
  JSON.stringify({ timestamp: new Date().toISOString(), local, remote, missing, ghosts }, null, 2)
);

console.log("\n💾 Report saved to scripts/audit/verify-edge-functions.json");
