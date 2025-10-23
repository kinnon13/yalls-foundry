#!/usr/bin/env -S deno run -A
// Sync config.toml with actual function folders
import { parse, stringify } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { ensureDir, exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const FIX = Deno.args.includes("--fix");
const CONFIG_PATH = "supabase/config.toml";
const FUNCS_DIR = "supabase/functions";
const AUDIT_DIR = "scripts/audit";

await ensureDir(AUDIT_DIR);

if (!(await exists(CONFIG_PATH)) || !(await exists(FUNCS_DIR))) {
  console.log("⚠️  config.toml or functions dir missing; skipping.");
  Deno.exit(0);
}

const config = parse(await Deno.readTextFile(CONFIG_PATH)) as Record<string, any>;
const existingKeys = Object.keys(config).filter(k => k.startsWith("functions.") && !k.endsWith(".cron"));
const inConfig = new Set(existingKeys.map(k => k.replace("functions.", "")));

const folders: string[] = [];
for await (const e of Deno.readDir(FUNCS_DIR)) {
  if (e.isDirectory && !e.name.startsWith(".") && e.name !== "_shared") folders.push(e.name);
}

const missing = folders.filter(f => !inConfig.has(f));
const report = { timestamp: new Date().toISOString(), missing, total: folders.length, configured: inConfig.size };
await Deno.writeTextFile(`${AUDIT_DIR}/sync-config.json`, JSON.stringify(report, null, 2));

if (FIX && missing.length > 0) {
  for (const name of missing) {
    config[`functions.${name}`] = { verify_jwt: false };
  }
  await Deno.writeTextFile(CONFIG_PATH, stringify(config));
  console.log(`✅ Added ${missing.length} missing function(s) to config.toml`);
} else if (missing.length > 0) {
  console.log(`ℹ️  Found ${missing.length} unconfigured function(s) (run with --fix to add)`);
} else {
  console.log(`✅ All ${folders.length} functions are configured`);
}
