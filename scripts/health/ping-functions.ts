#!/usr/bin/env -S deno run -A
// Live Function Health Check - pings all Edge Functions for 200 OK status
import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const CONFIG_PATH = "supabase/config.toml";
const HEALTH_DIR = "scripts/health";

await ensureDir(HEALTH_DIR);

if (!(await exists(CONFIG_PATH))) {
  console.error("❌ config.toml not found");
  Deno.exit(1);
}

const config = parse(await Deno.readTextFile(CONFIG_PATH)) as Record<string, any>;
const functionKeys = Object.keys(config).filter(k => k.startsWith("functions.") && !k.endsWith(".cron"));
const functionNames = functionKeys.map(k => k.replace("functions.", ""));

const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");

if (!supabaseUrl) {
  console.error("❌ SUPABASE_URL environment variable not set");
  console.log("ℹ️  This check requires a deployed Supabase project");
  Deno.exit(1);
}

console.log("🚀 Pinging all Edge Functions for health status...\n");
console.log(`Base URL: ${supabaseUrl}`);
console.log(`Functions to check: ${functionNames.length}\n`);

const results: Array<{
  name: string;
  ok: boolean;
  status?: number;
  error?: string;
  responseTime?: number;
}> = [];

for (const name of functionNames) {
  const url = `${supabaseUrl}/functions/v1/${name}`;
  const startTime = Date.now();
  
  try {
    // Use OPTIONS to avoid triggering actual function logic
    const response = await fetch(url, {
      method: "OPTIONS",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    const responseTime = Date.now() - startTime;
    const ok = response.ok || response.status === 204; // Accept both 200 and 204
    
    results.push({
      name,
      ok,
      status: response.status,
      responseTime
    });
    
    const emoji = ok ? "✅" : "❌";
    console.log(`${emoji} ${name.padEnd(40)} ${response.status} (${responseTime}ms)`);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    results.push({
      name,
      ok: false,
      error: error.message,
      responseTime
    });
    
    console.log(`❌ ${name.padEnd(40)} ERROR: ${error.message}`);
  }
}

const successful = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok).length;

const report = {
  timestamp: new Date().toISOString(),
  baseUrl: supabaseUrl,
  summary: {
    total: functionNames.length,
    successful,
    failed,
    avgResponseTime: Math.round(
      results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length
    )
  },
  results
};

await Deno.writeTextFile(
  `${HEALTH_DIR}/ping-results.json`,
  JSON.stringify(report, null, 2)
);

console.log(`\n${"=".repeat(80)}`);
console.log(`✅ Successful: ${successful}/${functionNames.length}`);
console.log(`❌ Failed: ${failed}/${functionNames.length}`);
console.log(`⏱️  Avg Response Time: ${report.summary.avgResponseTime}ms`);
console.log(`${"=".repeat(80)}\n`);

if (failed > 0) {
  console.log(`⚠️  ${failed} function(s) failed health check`);
  console.log(`ℹ️  Check ${HEALTH_DIR}/ping-results.json for details\n`);
  Deno.exit(1);
}
