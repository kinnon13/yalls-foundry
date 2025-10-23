#!/usr/bin/env -S deno run -A
// Supabase Config Guard - ensures function registration integrity
import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { header, line } from "../modules/logger.ts";

const CONFIG_PATH = "supabase/config.toml";
const FUNCS_DIR = "supabase/functions";

header("VERIFY SUPABASE CONFIG");

if (!(await exists(CONFIG_PATH))) {
  console.error("❌ CRITICAL: config.toml not found");
  line();
  Deno.exit(1);
}

if (!(await exists(FUNCS_DIR))) {
  console.error("❌ CRITICAL: functions directory not found");
  line();
  Deno.exit(1);
}

const config = parse(await Deno.readTextFile(CONFIG_PATH)) as Record<string, any>;
const configKeys = Object.keys(config).filter(k => k.startsWith("functions.") && !k.endsWith(".cron"));
const configFuncs = new Set(configKeys.map(k => k.replace("functions.", "")));

// Get actual function folders
const actualFolders: string[] = [];
for await (const entry of Deno.readDir(FUNCS_DIR)) {
  if (entry.isDirectory && !entry.name.startsWith(".") && entry.name !== "_shared") {
    actualFolders.push(entry.name);
  }
}

// Check for orphans (folders without config) and ghosts (config without folders)
const orphans = actualFolders.filter(f => !configFuncs.has(f));
const ghosts = [...configFuncs].filter(f => !actualFolders.includes(f));

console.log(`Config entries: ${configFuncs.size}`);
console.log(`Actual folders: ${actualFolders.length}`);
console.log(`Orphans (no config): ${orphans.length}`);
console.log(`Ghosts (no folder): ${ghosts.length}`);

if (orphans.length > 0) {
  console.log(`\n⚠️  Orphaned functions (missing config):`);
  orphans.forEach(f => console.log(`   - ${f}`));
}

if (ghosts.length > 0) {
  console.log(`\n⚠️  Ghost configs (missing folder):`);
  ghosts.forEach(f => console.log(`   - ${f}`));
}

line();

if (orphans.length > 0 || ghosts.length > 0) {
  console.error(`\n❌ SUPABASE CONFIG GUARD FAILED`);
  console.error(`   Run: deno run -A scripts/audit/sync-supabase-config.ts`);
  line();
  Deno.exit(1);
} else {
  console.log(`\n✅ SUPABASE CONFIG GUARD PASSED`);
  console.log(`   All functions properly registered`);
  line();
  Deno.exit(0);
}
